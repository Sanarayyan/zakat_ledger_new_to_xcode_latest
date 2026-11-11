from django.conf import settings
from django.core.exceptions import RequestDataTooBig
from django.http import JsonResponse


class PrivateApiResponses:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path.startswith('/api/'):
            # Bound work before DRF negotiates or decodes attacker-controlled input.
            if len(request.headers.get('Accept', '')) > 4096:
                return JsonResponse({'error': 'Accept header is too large.'}, status=431)
            try:
                if len(request.body) > settings.DATA_UPLOAD_MAX_MEMORY_SIZE:
                    raise RequestDataTooBig()
            except RequestDataTooBig:
                return JsonResponse({'error': 'Request body is too large.'}, status=413)
        response = self.get_response(request)
        if request.path.startswith('/api/'):
            response['Cache-Control'] = 'no-store'
            response['Pragma'] = 'no-cache'
        return response
