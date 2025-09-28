from flask import Flask, render_template, jsonify, request
from langchain.llms import CTransformers
from langchain.prompts import PromptTemplate
from dotenv import load_dotenv
import os

app = Flask(__name__)

load_dotenv()

# Simple medical prompt template without retrieval
simple_medical_prompt = """You are a medical assistant AI. Please provide helpful, accurate medical information based on the question below. Always remind users to consult with healthcare professionals for proper diagnosis and treatment.

Question: {question}

Answer:"""

PROMPT = PromptTemplate(template=simple_medical_prompt, input_variables=["question"])

# Load the Llama2 model
print("Loading Llama2 model...")
llm = CTransformers(
    model="model/llama-2-7b-chat.ggmlv3.q4_0.bin",
    model_type="llama",
    config={
        'max_new_tokens': 512,
        'temperature': 0.8,
        'context_length': 2048
    }
)
print("✅ Llama2 model loaded successfully!")

@app.route("/")
def index():
    return render_template('chat.html')

@app.route("/get", methods=["GET", "POST"])
def chat():
    msg = request.form["msg"]
    input_text = msg
    print(f"User question: {input_text}")
    
    # Format the prompt
    formatted_prompt = PROMPT.format(question=input_text)
    
    # Get response from Llama2 model
    try:
        result = llm(formatted_prompt)
        print(f"Response: {result}")
        return str(result)
    except Exception as e:
        print(f"Error: {e}")
        return "I apologize, but I'm having trouble processing your question right now. Please try again."

@app.route("/health")
def health():
    return jsonify({"status": "healthy", "model": "llama-2-7b-chat"})

if __name__ == '__main__':
    app.run(host="127.0.0.1", port=5000, debug=True)