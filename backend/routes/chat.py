"""
🚀 KOZAK AI Chat Endpoint
Advanced AI chat with function calling capabilities
"""

from flask import Blueprint, request, jsonify
import logging
import os
from backend.components.ai_tools.cloudflare_ai import CloudflareAI

# Create blueprint
chat_bp = Blueprint('chat', __name__)
logger = logging.getLogger(__name__)

# Initialize Cloudflare AI with function calling
cloudflare_ai = None

def init_cloudflare_ai():
    """Initialize Cloudflare AI instance"""
    global cloudflare_ai
    
    account_id = os.getenv('CLOUDFLARE_ACCOUNT_ID')
    api_token = os.getenv('CLOUDFLARE_API_TOKEN')
    weather_key = os.getenv('WEATHER_API_KEY')
    
    if account_id and api_token:
        cloudflare_ai = CloudflareAI(
            account_id=account_id,
            api_token=api_token,
            weather_api_key=weather_key
        )
        logger.info("🔧 Cloudflare AI with function calling initialized")
    else:
        logger.error("❌ Missing Cloudflare credentials")

# Initialize on import
init_cloudflare_ai()

@chat_bp.route('/api/ai/chat', methods=['POST'])
def ai_chat():
    """
    Advanced AI chat endpoint with function calling
    
    Expected payload:
    {
        "messages": [
            {"role": "user", "content": "What's the weather in Warsaw?"}
        ],
        "tools": ["get_weather", "get_system_info"],  // optional
        "max_tokens": 512,  // optional
        "temperature": 0.7  // optional
    }
    """
    
    if not cloudflare_ai:
        return jsonify({
            "success": False,
            "error": "Cloudflare AI not initialized"
        }), 500
    
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                "success": False,
                "error": "No JSON data provided"
            }), 400
        
        messages = data.get('messages', [])
        if not messages:
            return jsonify({
                "success": False,
                "error": "No messages provided"
            }), 400
        
        # Validate message format
        for msg in messages:
            if not isinstance(msg, dict) or 'role' not in msg or 'content' not in msg:
                return jsonify({
                    "success": False,
                    "error": "Invalid message format. Required: {'role': 'user/assistant', 'content': '...'}"
                }), 400
        
        # Extract parameters
        tools = data.get('tools')  # List of tool names or None for all
        max_tokens = data.get('max_tokens', 512)
        temperature = data.get('temperature', 0.7)
        max_tool_rounds = data.get('max_tool_rounds', 3)
        
        logger.info(f"AI Chat request: {len(messages)} messages, tools: {tools}")
        
        # Generate response with tools
        result = cloudflare_ai.generate_with_tools(
            messages=messages,
            tools=tools,
            max_tokens=max_tokens,
            temperature=temperature,
            max_tool_rounds=max_tool_rounds
        )
        
        if result.get("success"):
            logger.info(f"AI Chat success: {len(result.get('tool_calls_made', []))} tool calls")
            return jsonify(result)
        else:
            logger.error(f"AI Chat error: {result.get('error')}")
            return jsonify(result), 500
    
    except Exception as e:
        error_msg = f"AI Chat endpoint error: {str(e)}"
        logger.error(error_msg)
        return jsonify({
            "success": False,
            "error": error_msg
        }), 500

@chat_bp.route('/api/ai/tools', methods=['GET'])
def get_available_tools():
    """Get list of available AI tools"""
    
    if not cloudflare_ai:
        return jsonify({
            "success": False,
            "error": "Cloudflare AI not initialized"
        }), 500
    
    try:
        result = cloudflare_ai.get_available_tools_info()
        return jsonify(result)
    
    except Exception as e:
        error_msg = f"Tools endpoint error: {str(e)}"
        logger.error(error_msg)
        return jsonify({
            "success": False,
            "error": error_msg
        }), 500

@chat_bp.route('/api/ai/tools/test/<tool_name>', methods=['POST'])
def test_tool(tool_name):
    """Test specific tool with provided arguments"""
    
    if not cloudflare_ai:
        return jsonify({
            "success": False,
            "error": "Cloudflare AI not initialized"
        }), 500
    
    try:
        data = request.get_json() or {}
        arguments = data.get('arguments', {})
        
        logger.info(f"Testing tool: {tool_name} with args: {arguments}")
        
        # Execute tool directly
        result = cloudflare_ai.tools.execute_tool(tool_name, arguments)
        
        return jsonify({
            "success": True,
            "tool_name": tool_name,
            "arguments": arguments,
            "result": result
        })
    
    except Exception as e:
        error_msg = f"Tool test error: {str(e)}"
        logger.error(error_msg)
        return jsonify({
            "success": False,
            "error": error_msg
        }), 500
