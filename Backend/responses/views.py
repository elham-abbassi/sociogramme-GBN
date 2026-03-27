from rest_framework import generics
from .models import Response
from .serializers import ResponseSerializer


class ResponseCreateView(generics.CreateAPIView):
    queryset = Response.objects.all()
    serializer_class = ResponseSerializer