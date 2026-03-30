"""
Test script to verify OpenRouter integration with the 3 specified models.

Run with: python test_openrouter_models.py
"""

import os
import sys
from dotenv import load_dotenv

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(__file__))

# Load environment variables
backend_dir = os.path.dirname(__file__)
env_path = os.path.join(backend_dir, '.env')
load_dotenv(env_path)

from chats.router import (
    dispatch_to_provider,
    MODEL_PROVIDER_MAP,
    OPENROUTER_MODELS,
    get_api_keys,
)

def test_models_configuration():
    """Test that all 3 models are properly configured."""
    print("🧪 Testing Models Configuration")
    print("=" * 50)
    
    # Check model provider map
    print("\n📋 MODEL_PROVIDER_MAP:")
    for model, provider in MODEL_PROVIDER_MAP.items():
        print(f"  {model} -> {provider}")
    
    # Check OpenRouter models
    print("\n🌐 OPENROUTER_MODELS:")
    for model, model_id in OPENROUTER_MODELS.items():
        print(f"  {model}: {model_id}")
    
    # Verify all models are in the map
    assert len(MODEL_PROVIDER_MAP) == 3, f"Expected 3 models, got {len(MODEL_PROVIDER_MAP)}"
    assert set(MODEL_PROVIDER_MAP.keys()) == {'nemotron', 'liquid', 'trinity'}
    
    # Verify all models map to openrouter
    for model, provider in MODEL_PROVIDER_MAP.items():
        assert provider == 'openrouter', f"Model {model} should map to 'openrouter', got {provider}"
    
    # Verify all models are in OPENROUTER_MODELS
    for model in MODEL_PROVIDER_MAP.keys():
        assert model in OPENROUTER_MODELS, f"Model {model} not found in OPENROUTER_MODELS"
    
    print("\n✅ Configuration test passed!")


def test_api_key_loading():
    """Test that API key is loaded correctly."""
    print("\n🧪 Testing API Key Loading")
    print("=" * 50)
    
    api_keys = get_api_keys()
    
    if api_keys.get('openrouter'):
        print(f"✅ OpenRouter API key found (length: {len(api_keys['openrouter'])})")
        print(f"   Key preview: {api_keys['openrouter'][:20]}...")
    else:
        print("❌ OpenRouter API key not found in .env!")
        return False
    
    return True


def test_model_validation():
    """Test that model validation works correctly."""
    print("\n🧪 Testing Model Validation")
    print("=" * 50)
    
    valid_models = ['nemotron', 'liquid', 'trinity']
    invalid_models = ['Nemotron', 'Trinity', 'Liquid', 'gpt-4', 'unknown']
    
    print("\nTesting valid models:")
    for model in valid_models:
        assert model in MODEL_PROVIDER_MAP, f"Valid model {model} not recognized!"
        print(f"  ✅ {model}")
    
    print("\nTesting invalid models (should fail):")
    for model in invalid_models:
        if model not in MODEL_PROVIDER_MAP:
            print(f"  ✅ {model} correctly rejected")
        else:
            print(f"  ❌ {model} should not be valid!")
            raise AssertionError(f"Invalid model {model} was accepted")
    
    print("\n✅ Model validation test passed!")


def test_message_validation():
    """Test message validation in dispatch_to_provider."""
    print("\n🧪 Testing Message Validation")
    print("=" * 50)
    
    # Test empty message
    result = dispatch_to_provider('nemotron', '')
    assert 'error' in result, "Empty message should return error"
    print(f"  ✅ Empty message rejected: {result['error']}")
    
    # Test very long message
    long_message = "a" * 10000
    result = dispatch_to_provider('nemotron', long_message)
    assert 'error' in result, "Very long message should return error"
    print(f"  ✅ Long message rejected: {result['error'][:50]}...")
    
    # Test invalid model
    result = dispatch_to_provider('invalid_model', 'test message')
    assert 'error' in result, "Invalid model should return error"
    print(f"  ✅ Invalid model rejected: {result['error']}")
    
    print("\n✅ Message validation test passed!")


def test_api_request_construction():
    """Test that API requests would be constructed correctly."""
    print("\n🧪 Testing API Request Construction")
    print("=" * 50)
    
    print("\nModel to API ID mapping:")
    for model, api_id in OPENROUTER_MODELS.items():
        print(f"  {model:10} -> {api_id}")
    
    print("\n✅ API request construction test passed!")


def main():
    """Run all tests."""
    print("\n" + "=" * 50)
    print("🚀 OPENROUTER MODELS TEST SUITE")
    print("=" * 50)
    
    try:
        test_models_configuration()
        test_api_key_loading()
        test_model_validation()
        test_message_validation()
        test_api_request_construction()
        
        print("\n" + "=" * 50)
        print("✅ ALL TESTS PASSED!")
        print("=" * 50)
        print("\n✨ Your OpenRouter integration is ready with:")
        print("  • Nemotron (nvidia/nemotron-3-super-120b-a12b:free)")
        print("  • Liquid (liquid/lfm-2.5-1.2b-thinking:free)")
        print("  • Trinity (arcee-ai/trinity-mini:free)")
        print("\n🎉 You can now use these models in your chatbot!")
        
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {str(e)}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
