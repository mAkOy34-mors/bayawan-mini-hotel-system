"""apps/guests/serializers.py"""

from rest_framework import serializers
from .models import GuestInformation


class GuestInformationSerializer(serializers.ModelSerializer):
    """Matches Spring Boot GuestInformation fields — camelCase I/O."""

    firstName       = serializers.CharField(source="first_name")
    lastName        = serializers.CharField(source="last_name")
    gender          = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    homeAddress     = serializers.CharField(source="home_address")
    nationality     = serializers.CharField()
    dateOfBirth     = serializers.DateField(source="date_of_birth")
    contactNumber   = serializers.CharField(source="contact_number")
    idType          = serializers.ChoiceField(source="id_type", choices=GuestInformation.IdType.choices)
    idNumber        = serializers.CharField(source="id_number",        required=False, allow_blank=True, allow_null=True)
    passportNumber  = serializers.CharField(source="passport_number",  required=False, allow_blank=True, allow_null=True)
    visaType        = serializers.CharField(source="visa_type",        required=False, allow_blank=True, allow_null=True)
    visaExpiryDate  = serializers.DateField(source="visa_expiry_date", required=False, allow_null=True)
    createdAt       = serializers.DateTimeField(source="created_at",   read_only=True)
    updatedAt       = serializers.DateTimeField(source="updated_at",   read_only=True)

    class Meta:
        model = GuestInformation
        fields = [
            "id", "firstName", "lastName", "gender", "homeAddress",
            "nationality", "dateOfBirth", "contactNumber",
            "idType", "idNumber", "passportNumber",
            "visaType", "visaExpiryDate", "createdAt", "updatedAt",
        ]
        read_only_fields = ["id", "createdAt", "updatedAt"]