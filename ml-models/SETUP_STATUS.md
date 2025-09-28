# Medical Chatbot Setup Instructions

## Current Status: ✅ Environment Setup Complete

✅ **Step 1: Python Environment** - COMPLETED
   - Virtual environment created: `mchatbot-env`
   - All packages installed successfully

✅ **Step 2: Environment Variables** - COMPLETED  
   - `.env` file created with template
   - **ACTION NEEDED**: Add your Pinecone credentials

## Next Steps Required:

### 🔑 **Step 3: Get Pinecone API Credentials**
1. Visit: https://app.pinecone.io/
2. Sign up/login and create a new project
3. Get your API key and environment
4. Update the `.env` file with your actual credentials:
   ```
   PINECONE_API_KEY=your_actual_api_key_here
   PINECONE_API_ENV=your_actual_environment_here
   ```

### 📥 **Step 4: Download Llama2 Model** 
The model file is large (3.9GB) and needs to be downloaded manually:

**Option 1: Direct Download**
1. Visit: https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGML/tree/main
2. Download: `llama-2-7b-chat.ggmlv3.q4_0.bin`
3. Place it in the `model/` directory

**Option 2: Using wget (if available)**
```bash
cd model/
wget https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGML/resolve/main/llama-2-7b-chat.ggmlv3.q4_0.bin
```

### 🚀 **Step 5: Run the Chatbot**
Once the model is downloaded and Pinecone is configured:
```bash
# Process the medical knowledge base
python store_index.py

# Start the chatbot server  
python app.py
```

Then open: http://localhost:8080

## 📁 Project Structure:
```
End-to-end-Medical-Chatbot-using-Llama2/
├── data/Medical_book.pdf          # Medical knowledge base
├── model/llama-2-7b-chat.ggmlv3.q4_0.bin  # ← Download needed
├── .env                           # ← Add Pinecone credentials  
├── mchatbot-env/                  # ✅ Virtual environment ready
└── requirements.txt               # ✅ Packages installed
```

## 🔍 What This Chatbot Does:
- **RAG System**: Uses medical PDF + Llama2 for accurate responses
- **Vector Search**: Pinecone stores medical knowledge embeddings  
- **Local Processing**: Runs entirely on your machine
- **Medical Focus**: Trained specifically for healthcare questions

Ready to proceed once you have Pinecone credentials and the Llama2 model!