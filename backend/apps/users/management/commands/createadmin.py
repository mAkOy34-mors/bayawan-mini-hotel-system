# apps/users/management/commands/createadmin.py
from django.core.management.base import BaseCommand
from apps.users.models import User

class Command(BaseCommand):
    help = 'Create the first admin account'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING('\n=== Cebu Grand Hotel — Create Admin ===\n'))

        email    = input('Email:    ')
        username = input('Username: ')
        password = input('Password: ')

        if User.objects.filter(email=email).exists():
            self.stdout.write(self.style.ERROR(f'Error: {email} already exists.'))
            return

        user = User.objects.create_superuser(
            email=email,
            username=username,
            password=password,
        )
        user.role     = 'ADMIN'
        user.is_staff = True
        user.save()

        self.stdout.write(self.style.SUCCESS(f'\n✓ Admin account created successfully!'))
        self.stdout.write(self.style.SUCCESS(f'  Email:    {email}'))
        self.stdout.write(self.style.SUCCESS(f'  Username: {username}'))
        self.stdout.write(self.style.SUCCESS(f'  Role:     ADMIN\n'))