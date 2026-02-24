from rest_framework import serializers
from .models import Ticket


class TicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = [
            'id', 'title', 'description', 'category', 'priority',
            'status', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class TicketCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = ['title', 'description', 'category', 'priority']


class ClassifySerializer(serializers.Serializer):
    description = serializers.CharField(max_length=10000)


class ClassifyResponseSerializer(serializers.Serializer):
    suggested_category = serializers.CharField()
    suggested_priority = serializers.CharField()
