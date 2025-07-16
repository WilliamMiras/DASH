FROM public.ecr.aws/lambda/python:3.13

# Copy requirements first for better build caching
COPY requirements.txt ${LAMBDA_TASK_ROOT}/

# Install dependencies
RUN pip install --upgrade pip && \
    pip install -r ${LAMBDA_TASK_ROOT}/requirements.txt

# Copy all source code files
COPY . ${LAMBDA_TASK_ROOT}/

# Set the CMD to your Lambda handler
CMD ["lambda_function.lambda_handler"]

# Uncomment the following line if you want to run the FastAPI app directly
# This is useful for local development but not needed in Lambda
#CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8080"]