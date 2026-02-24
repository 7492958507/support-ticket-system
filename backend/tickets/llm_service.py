import json
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


def classify_ticket(description: str) -> dict:
    """
    Classify a ticket description using Claude API.
    Returns a dict with 'suggested_category' and 'suggested_priority'.
    """
    api_key = settings.LLM_API_KEY
    provider = settings.LLM_PROVIDER
    
    if not api_key:
        logger.warning("LLM_API_KEY not configured")
        return get_default_classification()
    
    if provider == 'anthropic':
        return classify_with_anthropic(description, api_key)
    else:
        logger.warning(f"Unknown LLM provider: {provider}")
        return get_default_classification()


def classify_with_anthropic(description: str, api_key: str) -> dict:
    """Classify using Anthropic Claude API."""
    try:
        from anthropic import Anthropic, APIError
        
        client = Anthropic(api_key=api_key)
        
        prompt = f"""You are a support ticket classification assistant. Based on the following ticket description, 
suggest the most appropriate category and priority level.

Categories: billing, technical, account, general
Priority levels: low, medium, high, critical

Guidelines:
- Billing issues (payments, invoices, subscriptions) -> billing, usually medium
- System errors, bugs, features -> technical, depends on severity
- Login, password, account access -> account, usually high
- Other -> general, usually low
- If description mentions urgency, system down, or critical impact -> critical
- If description describes annoying but not blocking -> low

Ticket Description:
{description}

Respond in JSON format:
{{"category": "<category>", "priority": "<priority>"}}

Only respond with valid JSON, no other text."""
        
        message = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=100,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        response_text = message.content[0].text.strip()
        result = json.loads(response_text)
        
        # Validate the response
        category = result.get('category', 'general')
        priority = result.get('priority', 'medium')
        
        # Ensure valid choices
        valid_categories = ['billing', 'technical', 'account', 'general']
        valid_priorities = ['low', 'medium', 'high', 'critical']
        
        if category not in valid_categories:
            category = 'general'
        if priority not in valid_priorities:
            priority = 'medium'
        
        return {
            'suggested_category': category,
            'suggested_priority': priority
        }
    except json.JSONDecodeError:
        logger.error("Failed to parse LLM response as JSON")
        return get_default_classification()
    except (APIError, Exception) as e:
        logger.error(f"LLM API error: {str(e)}")
        return get_default_classification()


def get_default_classification() -> dict:
    """Return sensible defaults when LLM is unavailable."""
    return {
        'suggested_category': 'general',
        'suggested_priority': 'medium'
    }
