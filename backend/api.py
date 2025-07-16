from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from main import agent_executor, parser 

app = FastAPI()

# Allow CORS for frontend domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://dash-ai-williammiras-projects.vercel.app/"],  # Replace "*" with your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/query")
async def query_agent(request: Request):
    data = await request.json()
    user_query = data.get("query")
    if not user_query:
        return JSONResponse({"error": "No query provided"}, status_code=400)
    raw_response = agent_executor.invoke({"query": user_query})
    try:
        structured_response = parser.parse(raw_response["output"])
        return structured_response.dict()
    except Exception as e:
        return JSONResponse({"error": str(e), "raw": raw_response["output"]}, status_code=500)

# For local testing
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)