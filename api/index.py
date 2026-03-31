import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '../backend'))

from config.asgi import application

app = application