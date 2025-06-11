from langchain_community.tools import DuckDuckGoSearchRun
from langchain.tools import Tool

search = DuckDuckGoSearchRun()
search_tool = Tool(
    name="search",
    func=search.run,
    description="A tool to search the web using DuckDuckGo. Useful for finding information about datasets, models, and more recent topics. Input should be a search query."
)
