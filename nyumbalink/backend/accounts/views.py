from rest_framework import generics, permissions
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import RegisterSerializer, UserSerializer
from .models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from listings.models import Review

class VerifyLandlordView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        email = request.data.get('email')
        try:
            user = User.objects.get(email=email)
            user.is_verified = True
            user.save()
            return Response({'message': f'{email} verified successfully'})
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)


class RegisterView(generics.CreateAPIView):
    queryset           = User.objects.all()
    serializer_class   = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class   = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class LoginView(TokenObtainPairView):
    permission_classes = [permissions.AllowAny]

class MyReviewsView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        from listings.serializers import ReviewSerializer
        reviews = Review.objects.filter(tenant=request.user).order_by('-created_at')
        data = []
        for r in reviews:
            data.append({
                'id': str(r.id),
                'listing': str(r.listing.id),
                'listing_title': r.listing.title,
                'rating': r.rating,
                'comment': r.comment,
                'created_at': r.created_at.isoformat(),
            })
        from rest_framework.response import Response
        return Response(data)


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        from rest_framework.response import Response
        user = request.user
        current = request.data.get('current_password')
        new_pw  = request.data.get('new_password')
        if not user.check_password(current):
            return Response({'error': 'Wrong password'}, status=400)
        user.set_password(new_pw)
        user.save()
        return Response({'message': 'Password changed'})
