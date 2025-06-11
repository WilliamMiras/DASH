from dotenv import load_dotenv
#from fastapi import FastAPI
from pydantic import BaseModel
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from langchain.agents import AgentExecutor, create_tool_calling_agent
from tools import search_tool

load_dotenv()

class DataQuery(BaseModel):
    #title: str
    summary: str
    relevancyExplained: str
    sources: list[str]
    tools_used: list[str]


llm = ChatOpenAI(model="gpt-4o", temperature=0.0)

parser = PydanticOutputParser(pydantic_object=DataQuery)
prompt = ChatPromptTemplate.from_messages(
    [
    ("system", 
     """
     You are a data aquiring agent to help the user compile a list of useful datasets to download for a project to train their model.  
     Answer the user query with the top three websites and or other information about datasets that might be of use. Use neccessary tools.
     Wrap the output in this format \n{format_instructions}
     """,
    ),
    ("placeholder", "{chat_history}"), 
    ("human", "{query}"),
    ("placeholder", "{agent_scratchpad}"),
    ]
).partial(format_instructions=parser.get_format_instructions())

agent = create_tool_calling_agent(
    llm=llm,
    tools=[search_tool],
    prompt=prompt,
)

agent_executor = AgentExecutor(
    agent=agent,
    tools=[search_tool],
    verbose=True,
    #return_intermediate_steps=True,
)

query = input("What is your project statement and purpose? ")
raw_response = agent_executor.invoke({"query":query})

try:
    structured_response = parser.parse(raw_response["output"])
    print(structured_response)
except Exception as e:
    print("Error parsing response:", e)
    print("Raw response:", raw_response["output"])
    structured_response = None
