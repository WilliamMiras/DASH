from .main import agent_executor, parser
import json

def lambda_handler(event, context):
    try:
        body = json.loads(event['body'])
        query = body.get('query', '')

        raw_response = agent_executor.invoke({"query": query})
        structured_response = parser.parse(raw_response["output"])

        return {
            "statusCode": 200,
            "body": json.dumps(structured_response.dict())
        }
    
    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({
                "error": str(e),
                "message": "An error occurred while processing your request."
            })
        }

