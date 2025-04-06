import requests
import json
import sys

# Default URL for the API
API_URL = "http://localhost:8000"

def query(question):
    """Send a query to the simplified endpoint and print the result"""
    url = f"{API_URL}/query"
    
    try:
        response = requests.post(url, json={"question": question})
        response.raise_for_status()  # Raise an exception for HTTP errors
        
        result = response.json()
        
        # Print the answer
        print("\n" + "="*80)
        print(f"QUESTION: {question}")
        print("="*80)
        print(f"ANSWER: {result['answer']}")
        print("-"*80)
        
        # Print additional details if available
        if result.get('success', False):
            if result.get('data_found', False):
                print(f"Found {result.get('result_count', 0)} results")
            else:
                print("No data found matching the query")
                
            # Print the SQL for reference
            if 'sql' in result:
                print("\nSQL QUERY:")
                print(result['sql'])
        else:
            if 'error' in result:
                print(f"ERROR: {result['error']}")
            if 'needs_clarification' in result and result['needs_clarification']:
                print(f"\nCLARIFICATION: {result.get('clarification', '')}")
                
        return result
        
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")
        return None

def main():
    """Main function to run the test client"""
    if len(sys.argv) > 1:
        # Use command line argument as the question
        question = " ".join(sys.argv[1:])
        query(question)
    else:
        # Interactive mode
        print("SQL Query Generator Test Client")
        print("Type 'exit' to quit")
        
        while True:
            question = input("\nEnter your question: ")
            if question.lower() in ['exit', 'quit', 'q']:
                break
                
            query(question)

if __name__ == "__main__":
    main()
