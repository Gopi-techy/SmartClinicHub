from dotenv import load_dotenv
import os

load_dotenv()

PINECONE_API_KEY = os.environ.get('PINECONE_API_KEY')

# Initialize Pinecone (newer version)
try:
    from pinecone import Pinecone as PineconeClient, ServerlessSpec
    pc = PineconeClient(api_key=PINECONE_API_KEY)
    use_new_pinecone = True
    print("Using newer Pinecone client")
except ImportError:
    # Fallback to older Pinecone initialization
    import pinecone
    pinecone.init(api_key=PINECONE_API_KEY)
    use_new_pinecone = False
    print("Using legacy Pinecone client")

index_name = "medical-bot"

if use_new_pinecone:
    # Check if index exists
    existing_indexes = pc.list_indexes()
    index_exists = any(index.name == index_name for index in existing_indexes)
    
    if not index_exists:
        print(f"Creating new index: {index_name}")
        pc.create_index(
            name=index_name,
            dimension=384,  # all-MiniLM-L6-v2 embedding dimension
            metric="cosine",
            spec=ServerlessSpec(
                cloud="aws",
                region="us-east-1"
            )
        )
        print(f"✅ Index '{index_name}' created successfully!")
    else:
        print(f"Index '{index_name}' already exists.")
        
    # List all indexes to verify
    indexes = pc.list_indexes()
    print("\nExisting indexes:")
    for index in indexes:
        print(f"  - {index.name}")
        
else:
    # Legacy Pinecone
    active_indexes = pinecone.list_indexes()
    if index_name not in active_indexes:
        print(f"Creating new index: {index_name}")
        pinecone.create_index(
            name=index_name,
            dimension=384,  # all-MiniLM-L6-v2 embedding dimension
            metric="cosine"
        )
        print(f"✅ Index '{index_name}' created successfully!")
    else:
        print(f"Index '{index_name}' already exists.")
        
    print(f"\nExisting indexes: {pinecone.list_indexes()}")