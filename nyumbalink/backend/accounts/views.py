from rest_framework import generics, permissions
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import RegisterSerializer, UserSerializer
from .models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions

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