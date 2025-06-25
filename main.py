from dotenv import load_dotenv
#from fastapi import FastAPI
from pydantic import BaseModel
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain.memory import ConversationBufferMemory
from tools import search_tool

load_dotenv()

# Toggle structured output for the agent for testing purposes
USE_STRUCTURED_OUTPUT = False

#Define the memory for the agent
memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)

class DataQuery(BaseModel):
    #title: str
    summary: str
    relevancyExplained: str
    sources: list[str]
    tools_used: list[str]


llm = ChatOpenAI(model="gpt-4o", temperature=0.0)

parser = PydanticOutputParser(pydantic_object=DataQuery)

prompt = ChatPromptTemplate.from_template(
    """
    You are a highly knowledgeable and helpful AI assistant that specializes in finding publicly available datasets
    for data science and machine learning projects.

    Your job is to help the user find the most relevant, high-quality datasets based on their request.

    Only return datasets that are:
    - Publicly accessible or easily downloadable.
    - Clearly related to the user's topic.
    - Preferably from trusted sources like Kaggle, Data.gov, UCI Machine Learning Repository, Google Dataset Search, 
    or academic/public research repositories.

    For each dataset, provide:
    1. **Dataset Name**
    2. **Short Description**
    3. **Source URL**
    4. (Optional) Notable features (e.g., columns, format, size)

    If the user's request is unclear or vague, ask clarifying questions first for more context before suggesting datasets.

    Chat History:
    {chat_history}

    User Query:
    {query}

    Your final answer should be a structured JSON object with the following fields:
    {format_instructions}

    {agent_scratchpad}
    """
).partial(format_instructions=parser.get_format_instructions())

# Create the agent with the search tool and the prompt
agent = create_tool_calling_agent(
    llm=llm,
    tools=[search_tool],
    prompt=prompt,
)

agent_executor = AgentExecutor(
    agent=agent,
    tools=[search_tool],
    verbose=True,
    memory=memory,
    #return_intermediate_steps=True,
)

if __name__ == "__main__":
    print("\n👋 Hi there! I'm your AI dataset scout, but you can call me DASH. Tell me about your project, and I’ll find the best datasets to help you get started.\n")
    query = input("📝 What is your project about, and what kind of data do you need?\n> ")

    raw_response = agent_executor.invoke({"query": query})

    if USE_STRUCTURED_OUTPUT:
        try:
            structured_response = parser.parse(raw_response["output"])
            print("\n📊 Here's a dataset summary I found:")
            print(structured_response)
        except Exception as e:
            print("\n⚠️ Error parsing response:", e)
            print("\nRaw response:", raw_response["output"])
            structured_response = None
    else:
        print("\n🧾 Here's what I found:")
        print(raw_response["output"])
