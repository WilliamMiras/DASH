
from langchain_community.utilities import SerpAPIWrapper
from langchain_community.tools import Tool
from dotenv import load_dotenv

load_dotenv()

search = SerpAPIWrapper()
search_tool = Tool(
    name="serpapi_search",
    func=search.run,
    description="A tool to search the web for datasets. Input should be a search query related to datasets, data science, or machine learning."
)