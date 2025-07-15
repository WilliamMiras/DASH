FROM public.ecr.aws/lambda/python:3.13

# Copy requirements first for better build caching
COPY requirements.txt ${LAMBDA_TASK_ROOT}/

# Install dependencies
RUN pip install --upgrade pip && \
    pip install -r ${LAMBDA_TASK_ROOT}/requirements.txt

# Copy all source code files
COPY lambda_function.py main.py tools.py ${LAMBDA_TASK_ROOT}/

# Set the CMD to your Lambda handler
CMD ["lambda_function.lambda_handler"]
