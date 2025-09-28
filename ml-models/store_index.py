from src.helper import load_pdf, text_split, download_hugging_face_embeddings
from langchain.vectorstores import Pinecone
import pinecone
from dotenv import load_dotenv
import os

load_dotenv()

PINECONE_API_KEY = os.environ.get('PINECONE_API_KEY')

print("Loading PDF and creating embeddings...")
extracted_data = load_pdf("data/")
text_chunks = text_split(extracted_data)
embeddings = download_hugging_face_embeddings()

# Initialize Pinecone (newer version - no environment needed for free tier)
try:
    # Try newer Pinecone initialization
    from pinecone import Pinecone as PineconeClient
    pc = PineconeClient(api_key=PINECONE_API_KEY)
    use_new_pinecone = True
    print("Using newer Pinecone client")
except ImportError:
    # Fallback to older Pinecone initialization
    pinecone.init(api_key=PINECONE_API_KEY)
    use_new_pinecone = False
    print("Using legacy Pinecone client")

index_name="medical-bot"

print(f"Creating embeddings and storing in Pinecone index: {index_name}")
#Creating Embeddings for Each of The Text Chunks & storing
docsearch=Pinecone.from_texts([t.page_content for t in text_chunks], embeddings, index_name=index_name)

print("✅ Medical knowledge base processed and stored in Pinecone successfully!")
