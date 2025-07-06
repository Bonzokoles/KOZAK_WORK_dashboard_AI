# 🚀 KOZAK_WORK_dashboard_AI

**Advanced AI-powered system monitoring and management dashboard with Cloudflare Workers AI integration**

## ✨ Features

### 🧠 AI-Powered Core
- **Cloudflare Workers AI Integration** - Embedded function calling capabilities
- **Multiple AI Models** - Support for Llama 3.1, Mistral 7B, and more
- **Function Calling** - Execute code alongside AI inference
- **Real-time AI Chat** - Interactive AI assistant with conversation history

### 📊 Dashboard Components  
- **System Monitoring** - Real-time performance metrics
- **Weather Integration** - Live weather data and forecasts
- **3D Visualizations** - Interactive data representations
- **Responsive Design** - Modern dark theme with orange accents

### 🛠️ Technical Stack
- **Backend**: Python Flask with modular architecture
- **Frontend**: HTML5, CSS3, JavaScript ES6+ 
- **AI**: Cloudflare Workers AI (@hf/nousresearch/hermes-2-pro-mistral-7b)
- **Database**: SQLite with migrations support
- **Deployment**: Docker ready with nginx configuration

## 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/Bonzokoles/KOZAK_WORK_dashboard_AI.git
cd KOZAK_WORK_dashboard_AI

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Run dashboard
python run.py
```

Access dashboard at `http://localhost:5080`

## 🔧 Configuration

### Environment Variables
```bash
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token  
WEATHER_API_KEY=your_weather_key
FLASK_ENV=development
```

### AI Models Available
- `@cf/meta/llama-3.1-8b-instruct` - Primary conversational model
- `@hf/nousresearch/hermes-2-pro-mistral-7b` - Function calling specialist
- `@cf/meta/llama-3.2-11b-vision-instruct` - Vision capabilities
- `@cf/mistral/mistral-7b-instruct-v0.1` - Efficient processing

## 🎯 Function Calling Capabilities

The dashboard supports embedded function calling for:
- **System Operations** - File management, process monitoring
- **API Integrations** - Weather, calendar, external services  
- **Data Processing** - Real-time analytics and calculations
- **Automation** - Smart task execution based on AI decisions

## 📁 Project Structure

```
KOZAK_WORK_dashboard_AI/
├── backend/
│   ├── components/ai_tools/    # AI integrations
│   ├── routes/                 # API endpoints
│   └── server.py              # Main application
├── frontend/
│   ├── static/js/             # JavaScript modules
│   ├── static/css/            # Styling
│   └── templates/             # HTML templates
├── config/                    # Configuration files
└── tests/                     # Test suites
```

## 🔄 Development Workflow

```bash
# Switch to development branch
git checkout feature/kozak-work-dashboard-ai

# Make changes and test
python run.py

# Commit and push
git add .
git commit -m "✨ Add new AI function"
git push origin feature/kozak-work-dashboard-ai
```

## 📈 Roadmap

- [ ] **Enhanced Function Calling** - More AI tools and integrations
- [ ] **Conversation Memory** - Persistent chat history 
- [ ] **Advanced Analytics** - ML-powered insights
- [ ] **Plugin System** - Extensible AI capabilities
- [ ] **Multi-user Support** - Role-based access control

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Cloudflare Workers AI** - Serverless AI infrastructure
- **Bootstrap** - UI framework
- **Flask** - Python web framework
- **OpenAI** - AI research and inspiration

---

**Built with ❤️ by Bonzo** | **Powered by Cloudflare Workers AI** 🚀