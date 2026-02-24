from django.core.management.base import BaseCommand
from django.core.management import execute_from_command_line
import os
import sys


class Command(BaseCommand):
    def handle(self, *args, **options):
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
        execute_from_command_line(['manage.py', 'migrate', '--noinput'])
