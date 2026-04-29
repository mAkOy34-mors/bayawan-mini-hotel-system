from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.payments.models import Payment
from .models import GuestReward, RewardHistory


@receiver(post_save, sender=Payment)
def award_points_on_payment(sender, instance, created, **kwargs):
    # Only trigger on PAID status
    if instance.status != 'PAID':
        return
    # Skip refunds
    if instance.type == 'REFUND':
        return

    # Get the booking to find the user
    from apps.bookings.models import Booking
    try:
        booking = Booking.objects.select_related('user').get(id=instance.booking_id)
    except Booking.DoesNotExist:
        return

    # Skip cancelled bookings
    if booking.status == 'CANCELLED':
        return

    user = booking.user

    # Check if points already awarded for this payment
    already_awarded = RewardHistory.objects.filter(
        user=user,
        description__icontains=str(instance.id),
        tx_type=RewardHistory.TxType.EARN,
    ).exists()
    if already_awarded:
        return

    # 10 points per ₱100 spent
    points_to_add = int(float(instance.amount) / 100) * 10
    if points_to_add <= 0:
        return

    # Get or create the guest's reward row
    reward, _ = GuestReward.objects.get_or_create(user=user)
    reward.points       += points_to_add
    reward.total_earned += points_to_add
    reward.save(update_fields=['points', 'total_earned', 'updated_at'])

    # Log it
    RewardHistory.objects.create(
        user=user,
        points=points_to_add,
        tx_type=RewardHistory.TxType.EARN,
        description=f'Earned from payment #{instance.id} — booking {booking.booking_reference}',
    )