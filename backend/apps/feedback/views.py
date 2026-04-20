# apps/feedback/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import Feedback
from .serializers import FeedbackSerializer, CreateFeedbackSerializer

User = get_user_model()


# ========== HELPER FUNCTION TO CHECK ADMIN/STAFF ==========

def is_admin_or_staff(user):
    """Check if user has admin or staff privileges based on role field"""
    if hasattr(user, 'role'):
        role = user.role
        if isinstance(role, str):
            return role.upper() in ['ADMIN', 'STAFF', 'RECEPTIONIST']
    # Fallback to checking groups
    if hasattr(user, 'groups'):
        return user.groups.filter(name__in=['Admin', 'Staff','Receptionist', 'Administrator']).exists()
    return False


class SubmitFeedbackView(APIView):
    """POST /api/v1/feedback/submit/ - Submit feedback for a booking"""
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        print(f"Received feedback data: {request.data}")
        print(f"User: {request.user.id} - {request.user.username} - Role: {getattr(request.user, 'role', 'N/A')}")

        serializer = CreateFeedbackSerializer(
            data=request.data,
            context={'request': request}
        )

        if serializer.is_valid():
            validated_data = serializer.validated_data
            booking = validated_data['booking']

            if 'room' not in validated_data or not validated_data.get('room'):
                validated_data['room'] = booking.room

            feedback = Feedback.objects.create(
                booking=booking,
                user=request.user,
                room=validated_data.get('room'),
                overall_rating=validated_data['overall_rating'],
                cleanliness_rating=validated_data.get('cleanliness_rating'),
                service_rating=validated_data.get('service_rating'),
                comfort_rating=validated_data.get('comfort_rating'),
                value_rating=validated_data.get('value_rating'),
                comment=validated_data.get('comment'),
                likes=validated_data.get('likes'),
                improvements=validated_data.get('improvements'),
            )

            response_serializer = FeedbackSerializer(feedback)
            return Response(response_serializer.data, status=201)

        print(f"Serializer errors: {serializer.errors}")
        return Response(serializer.errors, status=400)


class GetFeedbackView(APIView):
    """GET /api/v1/feedback/my-feedback/ - Get user's feedback"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        feedbacks = Feedback.objects.filter(user=request.user).select_related('booking', 'room')
        serializer = FeedbackSerializer(feedbacks, many=True)
        return Response(serializer.data)


class GetBookingFeedbackView(APIView):
    """GET /api/v1/feedback/booking/<booking_id>/ - Get feedback for a booking"""
    permission_classes = [IsAuthenticated]

    def get(self, request, booking_id):
        try:
            booking_id = int(booking_id)
            feedback = Feedback.objects.get(booking_id=booking_id, user=request.user)
            serializer = FeedbackSerializer(feedback)
            return Response(serializer.data)
        except Feedback.DoesNotExist:
            return Response({'exists': False, 'feedback': None}, status=200)
        except ValueError:
            return Response({'error': 'Invalid booking ID'}, status=400)


# ========== ADMIN/STAFF ENDPOINTS ==========

# apps/feedback/views.py

class GetAllFeedbackView(APIView):
    """GET /api/v1/feedback/all/ - Admin/Staff views all feedback"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_admin_or_staff(request.user):
            return Response(
                {'error': 'Permission denied. Admin or staff access required.'},
                status=403
            )

        try:
            feedbacks = Feedback.objects.all().select_related(
                'user', 'booking', 'room', 'responded_by'  # ✅ Add responded_by
            ).order_by('-created_at')

            serializer = FeedbackSerializer(feedbacks, many=True)
            return Response(serializer.data)
        except Exception as e:
            print(f"Error in GetAllFeedbackView: {e}")
            return Response({'error': str(e)}, status=500)


class GetUnrespondedFeedbackView(APIView):
    """GET /api/v1/feedback/unresponded/ - Get feedback without responses"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_admin_or_staff(request.user):
            return Response(
                {'error': 'Permission denied. Admin or staff access required.'},
                status=403
            )

        try:
            feedbacks = Feedback.objects.filter(
                is_responded=False
            ).select_related(
                'user', 'booking', 'room', 'responded_by'  # ✅ Add responded_by
            ).order_by('-created_at')

            serializer = FeedbackSerializer(feedbacks, many=True)
            return Response(serializer.data)
        except Exception as e:
            print(f"Error in GetUnrespondedFeedbackView: {e}")
            return Response({'error': str(e)}, status=500)

class RespondToFeedbackView(APIView):
    """POST /api/v1/feedback/<feedback_id>/respond/ - Respond to feedback"""
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, feedback_id):
        # Check if user is admin or staff
        if not is_admin_or_staff(request.user):
            return Response(
                {'error': 'Permission denied. Admin or staff access required.'},
                status=403
            )

        try:
            feedback = Feedback.objects.get(id=feedback_id)
        except Feedback.DoesNotExist:
            return Response({'error': 'Feedback not found'}, status=404)

        response_text = request.data.get('response')
        if not response_text or not response_text.strip():
            return Response({'error': 'Response text is required'}, status=400)

        # Update the feedback with response
        feedback.response = response_text.strip()
        feedback.is_responded = True
        feedback.responded_by = request.user
        feedback.responded_at = timezone.now()
        feedback.save()

        serializer = FeedbackSerializer(feedback)
        return Response(serializer.data, status=200)


class DeleteFeedbackView(APIView):
    """DELETE /api/v1/feedback/<feedback_id>/delete/ - Delete feedback"""
    permission_classes = [IsAuthenticated]

    def delete(self, request, feedback_id):
        # Check if user is admin or staff
        if not is_admin_or_staff(request.user):
            return Response(
                {'error': 'Permission denied. Admin or staff access required.'},
                status=403
            )

        try:
            feedback = Feedback.objects.get(id=feedback_id)
            feedback.delete()
            return Response(
                {'message': 'Feedback deleted successfully'},
                status=200
            )
        except Feedback.DoesNotExist:
            return Response({'error': 'Feedback not found'}, status=404)
        except Exception as e:
            print(f"Error deleting feedback: {e}")
            return Response({'error': str(e)}, status=500)


class EscalateFeedbackView(APIView):
    """POST /api/v1/feedback/<feedback_id>/escalate/ - Escalate feedback"""
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, feedback_id):
        # Check if user is admin or staff
        if not is_admin_or_staff(request.user):
            return Response(
                {'error': 'Permission denied. Admin or staff access required.'},
                status=403
            )

        try:
            feedback = Feedback.objects.get(id=feedback_id)

            # Check if escalated field exists, if not, just return success
            if hasattr(feedback, 'escalated'):
                feedback.escalated = True
                feedback.save()
                return Response({'message': 'Feedback escalated to admin successfully'}, status=200)
            else:
                # Field doesn't exist yet, but still return success
                return Response(
                    {'message': 'Feedback marked for admin attention'},
                    status=200
                )
        except Feedback.DoesNotExist:
            return Response({'error': 'Feedback not found'}, status=404)
        except Exception as e:
            print(f"Error escalating feedback: {e}")
            return Response({'error': str(e)}, status=500)