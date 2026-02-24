from django.http import JsonResponse
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Count, Q
from django.utils.dateparse import parse_date
from datetime import datetime, timedelta

from .models import Ticket
from .serializers import (
    TicketSerializer, TicketCreateSerializer,
    ClassifySerializer, ClassifyResponseSerializer
)
from .llm_service import classify_ticket


class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'priority', 'category', 'status']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return TicketCreateSerializer
        return TicketSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # Return full ticket data using TicketSerializer
        ticket = Ticket.objects.get(id=serializer.instance.id)
        output_serializer = TicketSerializer(ticket)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)
    
    def get_queryset(self):
        queryset = Ticket.objects.all()
        
        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        # Filter by priority
        priority = self.request.query_params.get('priority')
        if priority:
            queryset = queryset.filter(priority=priority)
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search)
            )
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get aggregated statistics about tickets.
        Uses database-level aggregation (not Python loops).
        """
        total_tickets = Ticket.objects.count()
        open_tickets = Ticket.objects.filter(status='open').count()
        
        # Calculate average tickets per day
        days_span = 1  # Default to today
        oldest_ticket = Ticket.objects.exclude(created_at=None).order_by('created_at').first()
        if oldest_ticket:
            days_span = max((datetime.now(oldest_ticket.created_at.tzinfo) - oldest_ticket.created_at).days + 1, 1)
        
        avg_tickets_per_day = total_tickets / days_span if days_span > 0 else 0
        
        # Priority breakdown - database-level aggregation
        priority_breakdown = dict(
            Ticket.objects
            .values('priority')
            .annotate(count=Count('id'))
            .values_list('priority', 'count')
        )
        
        # Ensure all priority levels are present
        priority_mapping = {
            'low': priority_breakdown.get('low', 0),
            'medium': priority_breakdown.get('medium', 0),
            'high': priority_breakdown.get('high', 0),
            'critical': priority_breakdown.get('critical', 0),
        }
        
        # Category breakdown - database-level aggregation
        category_breakdown = dict(
            Ticket.objects
            .values('category')
            .annotate(count=Count('id'))
            .values_list('category', 'count')
        )
        
        # Ensure all categories are present
        category_mapping = {
            'billing': category_breakdown.get('billing', 0),
            'technical': category_breakdown.get('technical', 0),
            'account': category_breakdown.get('account', 0),
            'general': category_breakdown.get('general', 0),
        }
        
        return Response({
            'total_tickets': total_tickets,
            'open_tickets': open_tickets,
            'avg_tickets_per_day': round(avg_tickets_per_day, 1),
            'priority_breakdown': priority_mapping,
            'category_breakdown': category_mapping,
        })
    
    @action(detail=False, methods=['post'])
    def classify(self, request):
        """
        Classify a ticket description using LLM.
        Returns suggested category and priority.
        """
        serializer = ClassifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        description = serializer.validated_data['description']
        
        try:
            result = classify_ticket(description)
            response_serializer = ClassifyResponseSerializer(result)
            return Response(response_serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            # Graceful failure - return sensible defaults
            return Response({
                'suggested_category': 'general',
                'suggested_priority': 'medium',
                'error': str(e)
            }, status=status.HTTP_200_OK)
