FROM python:3.10-slim-buster

WORKDIR /app

COPY . /app

# Install dependencies
RUN pip install -r requirements.txt

# Set environment variables from .env file
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Command to run the application
CMD ["python3", "app.py"]