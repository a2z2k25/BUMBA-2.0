/**
 * BUMBA LLM Specialist
 * Expert in large language models, fine-tuning, and LLM applications
 */

const UnifiedSpecialistBase = require('../../unified-specialist-base');

class LLMSpecialist extends UnifiedSpecialistBase {
  constructor() {
    super({
      name: 'LLM Specialist',
      expertise: ['Large Language Models', 'Fine-tuning', 'Prompt Engineering', 'RAG Systems'],
      models: ['claude-3-opus-20240229', 'gpt-4'],
      temperature: 0.3,
      systemPrompt: `You are an LLM expert specializing in:
        - Large language model architecture and training
        - Fine-tuning techniques (LoRA, QLoRA, full fine-tuning)
        - Prompt engineering and optimization
        - Retrieval-Augmented Generation (RAG) systems
        - Model evaluation and benchmarking
        - LLM deployment and optimization
        - Multi-modal and specialized models
        - Responsible AI and safety considerations
        Always prioritize accuracy, efficiency, and ethical considerations.`
    });

    this.capabilities = {
      fineTuning: true,
      promptEngineering: true,
      rag: true,
      evaluation: true,
      deployment: true,
      optimization: true,
      safety: true,
      multimodal: true
    };
  }

  async setupFineTuning(context) {
    const analysis = await this.analyze(context);
    
    return {
      strategy: this.selectFineTuningStrategy(analysis),
      implementation: this.implementFineTuning(analysis),
      evaluation: this.setupEvaluation(analysis),
      deployment: this.setupDeployment(analysis)
    };
  }

  selectFineTuningStrategy(analysis) {
    const strategies = {
      fullFineTuning: {
        description: 'Complete model parameter updates',
        suitable: analysis.hasLargeDataset && analysis.hasComputeResources,
        pros: ['Maximum customization', 'Best performance'],
        cons: ['High compute cost', 'Risk of catastrophic forgetting']
      },
      lora: {
        description: 'Low-Rank Adaptation - efficient fine-tuning',
        suitable: analysis.hasModerateDataset && analysis.limitedCompute,
        pros: ['Parameter efficient', 'Fast training', 'Lower memory'],
        cons: ['Limited capacity', 'May need task-specific tuning']
      },
      qlora: {
        description: 'Quantized LoRA for even more efficiency',
        suitable: analysis.hasSmallDataset || analysis.veryLimitedCompute,
        pros: ['Very memory efficient', 'Fast', 'Good for smaller models'],
        cons: ['Some quality trade-off', 'Limited to specific architectures']
      },
      promptTuning: {
        description: 'Soft prompt optimization',
        suitable: analysis.hasSmallDataset && analysis.simpleTask,
        pros: ['Very efficient', 'No model changes', 'Fast'],
        cons: ['Limited flexibility', 'Task-specific only']
      }
    };
    
    return strategies;
  }

  implementFineTuning(analysis) {
    if (analysis.technique === 'lora') {
      return this.implementLoRAFineTuning(analysis);
    } else if (analysis.technique === 'full') {
      return this.implementFullFineTuning(analysis);
    } else if (analysis.technique === 'qlora') {
      return this.implementQLoRAFineTuning(analysis);
    }
    
    return this.implementLoRAFineTuning(analysis);
  }

  implementLoRAFineTuning(analysis) {
    return `# LoRA Fine-tuning Implementation

import torch
import torch.nn as nn
from transformers import (
    AutoTokenizer, AutoModelForCausalLM, 
    TrainingArguments, Trainer, DataCollatorForLanguageModeling
)
from peft import LoraConfig, get_peft_model, TaskType
from datasets import Dataset
import wandb

class LoRAFineTuner:
    def __init__(self, model_name, tokenizer_name=None):
        self.model_name = model_name
        self.tokenizer_name = tokenizer_name or model_name
        
        # Load tokenizer
        self.tokenizer = AutoTokenizer.from_pretrained(self.tokenizer_name)
        if self.tokenizer.pad_token is None:
            self.tokenizer.pad_token = self.tokenizer.eos_token
        
        # Load model
        self.model = AutoModelForCausalLM.from_pretrained(
            model_name,
            torch_dtype=torch.float16,
            device_map="auto"
        )
        
    def setup_lora(self, rank=16, alpha=32, dropout=0.1, target_modules=None):
        \"\"\"Setup LoRA configuration\"\"\"
        
        if target_modules is None:
            # Default target modules for LLaMA-style models
            target_modules = ["q_proj", "v_proj", "k_proj", "o_proj", 
                            "gate_proj", "up_proj", "down_proj"]
        
        lora_config = LoraConfig(
            task_type=TaskType.CAUSAL_LM,
            inference_mode=False,
            r=rank,
            lora_alpha=alpha,
            lora_dropout=dropout,
            target_modules=target_modules,
            bias="none"
        )
        
        self.model = get_peft_model(self.model, lora_config)
        self.model.print_trainable_parameters()
        
        return self.model
    
    def prepare_dataset(self, data, max_length=512):
        \"\"\"Prepare dataset for training\"\"\"
        
        def tokenize_function(examples):
            # For instruction following format
            prompts = []
            for instruction, input_text, output in zip(
                examples['instruction'], examples['input'], examples['output']
            ):
                if input_text:
                    prompt = f"### Instruction:\\n{instruction}\\n\\n### Input:\\n{input_text}\\n\\n### Response:\\n{output}"
                else:
                    prompt = f"### Instruction:\\n{instruction}\\n\\n### Response:\\n{output}"
                prompts.append(prompt)
            
            # Tokenize
            tokenized = self.tokenizer(
                prompts,
                truncation=True,
                padding=False,
                max_length=max_length,
                return_tensors=None
            )
            
            # Labels are same as input_ids for causal LM
            tokenized["labels"] = tokenized["input_ids"].copy()
            
            return tokenized
        
        # Convert to HuggingFace dataset
        dataset = Dataset.from_pandas(data)
        tokenized_dataset = dataset.map(
            tokenize_function,
            batched=True,
            remove_columns=dataset.column_names
        )
        
        return tokenized_dataset
    
    def train(self, train_dataset, eval_dataset=None, output_dir="./lora_model"):
        \"\"\"Train the model with LoRA\"\"\"
        
        # Training arguments
        training_args = TrainingArguments(
            output_dir=output_dir,
            num_train_epochs=3,
            per_device_train_batch_size=4,
            per_device_eval_batch_size=4,
            gradient_accumulation_steps=4,
            warmup_steps=100,
            learning_rate=2e-4,
            fp16=True,
            logging_steps=10,
            evaluation_strategy="steps" if eval_dataset else "no",
            eval_steps=100 if eval_dataset else None,
            save_steps=200,
            save_total_limit=3,
            load_best_model_at_end=True if eval_dataset else False,
            report_to="wandb",
            run_name=f"lora_finetune_{self.model_name.split('/')[-1]}"
        )
        
        # Data collator
        data_collator = DataCollatorForLanguageModeling(
            tokenizer=self.tokenizer,
            mlm=False,
            pad_to_multiple_of=8
        )
        
        # Trainer
        trainer = Trainer(
            model=self.model,
            args=training_args,
            train_dataset=train_dataset,
            eval_dataset=eval_dataset,
            data_collator=data_collator,
            tokenizer=self.tokenizer
        )
        
        # Start training
        trainer.train()
        
        # Save the model
        trainer.save_model()
        self.tokenizer.save_pretrained(output_dir)
        
        return trainer
    
    def inference(self, prompt, max_length=256, temperature=0.7):
        \"\"\"Generate text with fine-tuned model\"\"\"
        
        # Tokenize input
        inputs = self.tokenizer(prompt, return_tensors="pt").to(self.model.device)
        
        # Generate
        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_length=max_length,
                temperature=temperature,
                do_sample=True,
                pad_token_id=self.tokenizer.eos_token_id
            )
        
        # Decode output
        generated_text = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Remove input prompt from output
        response = generated_text[len(prompt):].strip()
        
        return response

# Usage example
def fine_tune_llama_with_lora():
    import pandas as pd
    
    # Initialize fine-tuner
    fine_tuner = LoRAFineTuner("meta-llama/Llama-2-7b-hf")
    
    # Setup LoRA
    model = fine_tuner.setup_lora(rank=16, alpha=32)
    
    # Prepare training data
    train_data = pd.DataFrame({
        'instruction': ['Explain quantum computing', 'Write a Python function'],
        'input': ['', 'to calculate fibonacci numbers'],
        'output': ['Quantum computing uses quantum mechanics...', 'def fibonacci(n):\\n    if n <= 1:\\n        return n...']
    })
    
    train_dataset = fine_tuner.prepare_dataset(train_data)
    
    # Train
    trainer = fine_tuner.train(train_dataset)
    
    # Test inference
    prompt = "### Instruction:\\nExplain machine learning\\n\\n### Response:\\n"
    response = fine_tuner.inference(prompt)
    print(response)

if __name__ == "__main__":
    fine_tune_llama_with_lora()`;
  }

  setupRAGSystem(analysis) {
    return `# Retrieval-Augmented Generation (RAG) System

import torch
from transformers import AutoTokenizer, AutoModel
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
import chromadb
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import Chroma
from langchain.llms import HuggingFacePipeline
from langchain.chains import RetrievalQA
import pandas as pd

class RAGSystem:
    def __init__(self, embedding_model="sentence-transformers/all-MiniLM-L6-v2",
                 llm_model="microsoft/DialoGPT-medium"):
        
        self.embedding_model = SentenceTransformer(embedding_model)
        self.llm_model = llm_model
        self.vector_store = None
        self.retriever = None
        self.qa_chain = None
        
    def create_vector_store(self, documents, chunk_size=1000, chunk_overlap=200):
        \"\"\"Create vector store from documents\"\"\"
        
        # Split documents into chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
        )
        
        chunks = []
        for doc in documents:
            doc_chunks = text_splitter.split_text(doc['content'])
            for i, chunk in enumerate(doc_chunks):
                chunks.append({
                    'content': chunk,
                    'source': doc.get('source', 'unknown'),
                    'chunk_id': f"{doc.get('id', 'doc')}_{i}"
                })
        
        # Create embeddings
        embeddings = []
        texts = []
        metadatas = []
        
        for chunk in chunks:
            embedding = self.embedding_model.encode(chunk['content'])
            embeddings.append(embedding)
            texts.append(chunk['content'])
            metadatas.append({
                'source': chunk['source'],
                'chunk_id': chunk['chunk_id']
            })
        
        # Initialize Chroma vector store
        self.vector_store = Chroma.from_texts(
            texts=texts,
            embeddings=HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2"),
            metadatas=metadatas,
            persist_directory="./chroma_db"
        )
        
        # Create retriever
        self.retriever = self.vector_store.as_retriever(
            search_type="similarity",
            search_kwargs={"k": 5}
        )
        
        return self.vector_store
    
    def setup_qa_chain(self, model_name=None):
        \"\"\"Setup QA chain with LLM and retriever\"\"\"
        
        if model_name:
            self.llm_model = model_name
        
        # Setup LLM pipeline
        llm = HuggingFacePipeline.from_model_id(
            model_id=self.llm_model,
            task="text-generation",
            model_kwargs={
                "temperature": 0.7,
                "max_length": 512,
                "torch_dtype": torch.float16
            }
        )
        
        # Create QA chain
        self.qa_chain = RetrievalQA.from_chain_type(
            llm=llm,
            chain_type="stuff",
            retriever=self.retriever,
            return_source_documents=True,
            chain_type_kwargs={
                "prompt": self.create_qa_prompt()
            }
        )
        
        return self.qa_chain
    
    def create_qa_prompt(self):
        \"\"\"Create custom prompt template for QA\"\"\"
        from langchain.prompts import PromptTemplate
        
        template = \"\"\"Use the following pieces of context to answer the question at the end. 
        If you don't know the answer, just say that you don't know, don't try to make up an answer.

        Context:
        {context}

        Question: {question}
        
        Answer: \"\"\"
        
        return PromptTemplate(
            template=template,
            input_variables=["context", "question"]
        )
    
    def query(self, question, return_sources=True):
        \"\"\"Query the RAG system\"\"\"
        
        if not self.qa_chain:
            raise ValueError("QA chain not setup. Call setup_qa_chain() first.")
        
        # Get answer
        result = self.qa_chain({"query": question})
        
        response = {
            "answer": result["result"],
            "question": question
        }
        
        if return_sources and "source_documents" in result:
            sources = []
            for doc in result["source_documents"]:
                sources.append({
                    "content": doc.page_content,
                    "metadata": doc.metadata
                })
            response["sources"] = sources
        
        return response
    
    def add_documents(self, new_documents):
        \"\"\"Add new documents to existing vector store\"\"\"
        
        if not self.vector_store:
            return self.create_vector_store(new_documents)
        
        # Process new documents
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )
        
        texts = []
        metadatas = []
        
        for doc in new_documents:
            chunks = text_splitter.split_text(doc['content'])
            for i, chunk in enumerate(chunks):
                texts.append(chunk)
                metadatas.append({
                    'source': doc.get('source', 'unknown'),
                    'chunk_id': f"{doc.get('id', 'doc')}_{i}"
                })
        
        # Add to vector store
        self.vector_store.add_texts(texts, metadatas)
        
        return len(texts)
    
    def semantic_search(self, query, k=5):
        \"\"\"Perform semantic search without LLM generation\"\"\"
        
        if not self.vector_store:
            raise ValueError("Vector store not created.")
        
        # Search similar documents
        docs = self.vector_store.similarity_search(query, k=k)
        
        results = []
        for doc in docs:
            results.append({
                "content": doc.page_content,
                "metadata": doc.metadata,
                "similarity_score": getattr(doc, 'similarity_score', None)
            })
        
        return results
    
    def evaluate_retrieval(self, test_questions, ground_truth_docs):
        \"\"\"Evaluate retrieval performance\"\"\"
        
        metrics = {
            "precision_at_k": [],
            "recall_at_k": [],
            "mrr": []  # Mean Reciprocal Rank
        }
        
        for i, question in enumerate(test_questions):
            # Get retrieved documents
            retrieved_docs = self.semantic_search(question, k=5)
            retrieved_ids = [doc['metadata']['chunk_id'] for doc in retrieved_docs]
            
            # Ground truth for this question
            relevant_ids = ground_truth_docs[i]
            
            # Calculate precision@k
            relevant_retrieved = len(set(retrieved_ids) & set(relevant_ids))
            precision = relevant_retrieved / len(retrieved_ids) if retrieved_ids else 0
            metrics["precision_at_k"].append(precision)
            
            # Calculate recall@k
            recall = relevant_retrieved / len(relevant_ids) if relevant_ids else 0
            metrics["recall_at_k"].append(recall)
            
            # Calculate MRR
            rr = 0
            for rank, doc_id in enumerate(retrieved_ids, 1):
                if doc_id in relevant_ids:
                    rr = 1 / rank
                    break
            metrics["mrr"].append(rr)
        
        # Average metrics
        avg_metrics = {
            "avg_precision_at_5": np.mean(metrics["precision_at_k"]),
            "avg_recall_at_5": np.mean(metrics["recall_at_k"]),
            "mean_reciprocal_rank": np.mean(metrics["mrr"])
        }
        
        return avg_metrics

# Advanced RAG with reranking
class AdvancedRAGSystem(RAGSystem):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # Load reranker model
        from sentence_transformers import CrossEncoder
        self.reranker = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')
    
    def query_with_reranking(self, question, initial_k=20, final_k=5):
        \"\"\"Query with document reranking\"\"\"
        
        # Initial retrieval
        initial_docs = self.semantic_search(question, k=initial_k)
        
        # Rerank documents
        pairs = [[question, doc['content']] for doc in initial_docs]
        scores = self.reranker.predict(pairs)
        
        # Sort by reranking scores
        scored_docs = list(zip(initial_docs, scores))
        scored_docs.sort(key=lambda x: x[1], reverse=True)
        
        # Take top k after reranking
        reranked_docs = [doc for doc, score in scored_docs[:final_k]]
        
        # Generate answer using reranked context
        context = "\\n\\n".join([doc['content'] for doc in reranked_docs])
        
        # Use LLM for generation (simplified)
        prompt = f"Context: {context}\\n\\nQuestion: {question}\\n\\nAnswer:"
        
        return {
            "answer": "Generated answer based on reranked context",
            "reranked_sources": reranked_docs,
            "reranking_scores": [score for doc, score in scored_docs[:final_k]]
        }

# Usage example
def setup_rag_system():
    # Sample documents
    documents = [
        {
            "id": "doc1",
            "content": "Machine learning is a subset of artificial intelligence...",
            "source": "ml_textbook.pdf"
        },
        {
            "id": "doc2", 
            "content": "Deep learning uses neural networks with multiple layers...",
            "source": "dl_research.pdf"
        }
    ]
    
    # Create RAG system
    rag = RAGSystem()
    
    # Create vector store
    rag.create_vector_store(documents)
    
    # Setup QA chain
    rag.setup_qa_chain("microsoft/DialoGPT-small")
    
    # Query the system
    response = rag.query("What is machine learning?")
    print(f"Answer: {response['answer']}")
    print(f"Sources: {len(response['sources'])} documents used")
    
    return rag

if __name__ == "__main__":
    rag_system = setup_rag_system()`;
  }

  setupPromptEngineering(analysis) {
    return `# Prompt Engineering Framework

import re
import json
from typing import List, Dict, Any
from dataclasses import dataclass
import openai
from transformers import pipeline

@dataclass
class PromptTemplate:
    name: str
    template: str
    variables: List[str]
    description: str
    examples: List[Dict[str, str]]

class PromptEngineer:
    def __init__(self, model_name="gpt-3.5-turbo"):
        self.model_name = model_name
        self.templates = {}
        self.evaluation_metrics = {}
        
    def create_template(self, name, template, variables, description="", examples=None):
        \"\"\"Create a new prompt template\"\"\"
        
        if examples is None:
            examples = []
        
        self.templates[name] = PromptTemplate(
            name=name,
            template=template,
            variables=variables,
            description=description,
            examples=examples
        )
        
        return self.templates[name]
    
    def format_prompt(self, template_name, **kwargs):
        \"\"\"Format a prompt template with given variables\"\"\"
        
        if template_name not in self.templates:
            raise ValueError(f"Template '{template_name}' not found")
        
        template = self.templates[template_name]
        
        # Check required variables
        missing_vars = set(template.variables) - set(kwargs.keys())
        if missing_vars:
            raise ValueError(f"Missing required variables: {missing_vars}")
        
        # Format template
        formatted_prompt = template.template
        for var, value in kwargs.items():
            formatted_prompt = formatted_prompt.replace(f"{{{var}}}", str(value))
        
        return formatted_prompt
    
    def chain_of_thought_prompt(self, task, examples=None):
        \"\"\"Create a chain-of-thought prompt\"\"\"
        
        base_template = \"\"\"Let's think step by step to solve this problem.

Task: {task}

{examples}

Now, let's solve the given problem step by step:

Problem: {problem}

Step-by-step solution:\"\"\"
        
        example_text = ""
        if examples:
            example_text = "Examples:\\n"
            for i, example in enumerate(examples, 1):
                example_text += f"\\nExample {i}:\\n"
                example_text += f"Problem: {example['problem']}\\n"
                example_text += f"Solution: {example['solution']}\\n"
        
        return self.create_template(
            name="chain_of_thought",
            template=base_template,
            variables=["task", "examples", "problem"],
            description="Chain-of-thought reasoning prompt"
        )
    
    def few_shot_prompt(self, task, examples, shot_count=3):
        \"\"\"Create a few-shot learning prompt\"\"\"
        
        template = f"Task: {{task}}\\n\\n"
        
        # Add examples
        for i in range(shot_count):
            template += f"Example {i+1}:\\n"
            template += f"Input: {{example_{i}_input}}\\n"
            template += f"Output: {{example_{i}_output}}\\n\\n"
        
        template += "Now solve this:\\nInput: {input}\\nOutput:"
        
        # Create variable list
        variables = ["task", "input"]
        for i in range(shot_count):
            variables.extend([f"example_{i}_input", f"example_{i}_output"])
        
        return self.create_template(
            name="few_shot",
            template=template,
            variables=variables,
            description=f"{shot_count}-shot learning prompt",
            examples=examples[:shot_count]
        )
    
    def role_based_prompt(self, role, task, context=""):
        \"\"\"Create a role-based prompt\"\"\"
        
        template = f\"\"\"You are a {role}. {context}

Your task is to: {{task}}

{{{role}_instructions}}

Input: {{input}}

Response:\"\"\"
        
        return self.create_template(
            name=f"role_based_{role.lower().replace(' ', '_')}",
            template=template,
            variables=["task", f"{role.lower().replace(' ', '_')}_instructions", "input"],
            description=f"Role-based prompt for {role}"
        )
    
    def evaluate_prompt(self, template_name, test_cases, evaluation_function=None):
        \"\"\"Evaluate a prompt template on test cases\"\"\"
        
        if template_name not in self.templates:
            raise ValueError(f"Template '{template_name}' not found")
        
        results = []
        
        for test_case in test_cases:
            # Format prompt
            prompt = self.format_prompt(template_name, **test_case['input'])
            
            # Generate response
            response = self.generate_response(prompt)
            
            # Evaluate response
            if evaluation_function:
                score = evaluation_function(response, test_case.get('expected_output'))
            else:
                score = self.default_evaluation(response, test_case.get('expected_output'))
            
            results.append({
                'input': test_case['input'],
                'prompt': prompt,
                'response': response,
                'expected': test_case.get('expected_output'),
                'score': score
            })
        
        # Calculate average score
        avg_score = sum(r['score'] for r in results) / len(results)
        
        self.evaluation_metrics[template_name] = {
            'average_score': avg_score,
            'results': results,
            'total_tests': len(test_cases)
        }
        
        return self.evaluation_metrics[template_name]
    
    def generate_response(self, prompt):
        \"\"\"Generate response using the specified model\"\"\"
        
        if "gpt" in self.model_name.lower():
            # OpenAI API
            response = openai.ChatCompletion.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=500,
                temperature=0.7
            )
            return response.choices[0].message.content
        else:
            # Use HuggingFace pipeline for other models
            generator = pipeline("text-generation", model=self.model_name)
            response = generator(prompt, max_length=500, num_return_sequences=1)
            return response[0]['generated_text'][len(prompt):].strip()
    
    def default_evaluation(self, response, expected=None):
        \"\"\"Default evaluation function\"\"\"
        if expected is None:
            return 1.0  # No ground truth, assume success
        
        # Simple similarity check
        response_words = set(response.lower().split())
        expected_words = set(expected.lower().split())
        
        if len(expected_words) == 0:
            return 1.0
        
        intersection = response_words & expected_words
        return len(intersection) / len(expected_words)
    
    def optimize_prompt(self, template_name, test_cases, optimization_method="iterative"):
        \"\"\"Optimize a prompt template\"\"\"
        
        if optimization_method == "iterative":
            return self.iterative_optimization(template_name, test_cases)
        elif optimization_method == "genetic":
            return self.genetic_optimization(template_name, test_cases)
        else:
            raise ValueError(f"Unknown optimization method: {optimization_method}")
    
    def iterative_optimization(self, template_name, test_cases, iterations=5):
        \"\"\"Iteratively improve prompt based on test results\"\"\"
        
        current_template = self.templates[template_name]
        best_score = 0
        best_template = current_template
        
        for iteration in range(iterations):
            # Evaluate current template
            results = self.evaluate_prompt(template_name, test_cases)
            current_score = results['average_score']
            
            if current_score > best_score:
                best_score = current_score
                best_template = current_template
            
            # Generate variations
            variations = self.generate_template_variations(current_template)
            
            # Test variations
            for variation in variations:
                self.templates[f"{template_name}_variation"] = variation
                var_results = self.evaluate_prompt(f"{template_name}_variation", test_cases)
                
                if var_results['average_score'] > current_score:
                    current_template = variation
                    current_score = var_results['average_score']
        
        # Update original template with best version
        self.templates[template_name] = best_template
        
        return {
            'optimized_template': best_template,
            'best_score': best_score,
            'iterations': iterations
        }
    
    def generate_template_variations(self, template):
        \"\"\"Generate variations of a template\"\"\"
        
        variations = []
        
        # Add more specific instructions
        specific_template = PromptTemplate(
            name=f"{template.name}_specific",
            template=template.template + "\\n\\nBe specific and detailed in your response.",
            variables=template.variables,
            description=f"{template.description} (more specific)",
            examples=template.examples
        )
        variations.append(specific_template)
        
        # Add step-by-step instruction
        stepwise_template = PromptTemplate(
            name=f"{template.name}_stepwise",
            template=template.template + "\\n\\nThink through this step by step.",
            variables=template.variables,
            description=f"{template.description} (step-by-step)",
            examples=template.examples
        )
        variations.append(stepwise_template)
        
        # Add constraint
        constrained_template = PromptTemplate(
            name=f"{template.name}_constrained",
            template=template.template + "\\n\\nKeep your response concise and under 100 words.",
            variables=template.variables,
            description=f"{template.description} (constrained)",
            examples=template.examples
        )
        variations.append(constrained_template)
        
        return variations

# Usage example
def example_prompt_engineering():
    # Initialize prompt engineer
    pe = PromptEngineer()
    
    # Create a classification template
    classification_template = pe.create_template(
        name="sentiment_classification",
        template=\"\"\"Classify the sentiment of the following text as positive, negative, or neutral.

Text: {text}

Sentiment:\"\"\",
        variables=["text"],
        description="Sentiment classification prompt"
    )
    
    # Create few-shot template
    examples = [
        {"problem": "2 + 2", "solution": "4"},
        {"problem": "5 * 3", "solution": "15"},
        {"problem": "10 / 2", "solution": "5"}
    ]
    
    math_template = pe.few_shot_prompt(
        task="Solve basic arithmetic problems",
        examples=examples,
        shot_count=3
    )
    
    # Test cases for evaluation
    test_cases = [
        {
            "input": {"text": "I love this product!"},
            "expected_output": "positive"
        },
        {
            "input": {"text": "This is terrible."},
            "expected_output": "negative"
        }
    ]
    
    # Evaluate template
    results = pe.evaluate_prompt("sentiment_classification", test_cases)
    print(f"Average score: {results['average_score']}")
    
    return pe

if __name__ == "__main__":
    prompt_engineer = example_prompt_engineering()`;
  }
}

module.exports = LLMSpecialist;