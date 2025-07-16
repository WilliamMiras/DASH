from main import agent_executor, parser
import json

def lambda_handler(event, context):
    try:
        print("Received event:", event)  # Debug: log the incoming event

        body = event.get('body')
        # Handle both string and dict cases for body
        if isinstance(body, str):
            try:
                body = json.loads(body)
            except Exception as e:
                print("Error parsing body as JSON:", e)
                body = {}
        elif isinstance(body, dict):
            pass  # Already a dict
        else:
            body = {}

        print("Parsed body:", body)  # Debug: log the parsed body

        query = body.get('query', '')
        print("Query received:", query)  # Debug: log the query

        raw_response = agent_executor.invoke({"query": query})
        structured_response = parser.parse(raw_response["output"])

        return {
            "statusCode": 200,
            "body": json.dumps(structured_response.dict()),
            "headers": {"Content-Type": "application/json"}
        }

    except Exception as e:
        print("Exception:", e)  # Debug: log the exception
        return {
            "statusCode": 500,
            "body": json.dumps({
                "error": str(e),
                "message": "An error occurred while processing your request."
            }),
            "headers": {"Content-Type": "application/json"}
        }

