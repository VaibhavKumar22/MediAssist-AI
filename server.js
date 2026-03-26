require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is working!' });
});

// Routes
app.post('/api/chat', async (req, res) => {
    try {
        console.log('Received chat request:', req.body);
        const { message } = req.body;
        
        if (!message) {
            console.error('No message provided');
            return res.status(400).json({ error: 'No message provided' });
        }

        if (!process.env.GEMINI_API_KEY) {
            console.error('API key is missing');
            return res.status(500).json({ error: 'API key is not configured' });
        }

        console.log('Initializing Gemini model...');
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        
        console.log('Generating content...');
        const prompt = `You are an AI health assistant. The user has asked: "${message}".

        If the message is a general greeting (like "hi", "hello", "hey"):
        - Respond with a simple greeting
        - Ask how you can help with their health concerns

        If the message is a health-related question:
        Give a clean, simple response with these 4 paragraphs, each separated by a blank line:

        Paragraph 1 - What it is:
        - Brief explanation

        Paragraph 2 - What to do:
        - Action 1
        - Action 2
        - Action 3

        Paragraph 3 - Possible diseases:
        - Disease 1
        - Disease 2
        - Disease 3

        Paragraph 4 - When to see a doctor:
        - Warning sign 1
        - Warning sign 2
        - Warning sign 3

        Rules:
        - Use simple dashes (-) for points
        - No extra formatting or symbols
        - No follow-up questions
        - Keep each paragraph on a new line
        - Add a blank line between paragraphs
        - Keep each point on a new line
        - Use plain language`;

        try {
            const result = await model.generateContent({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            });

            const response = await result.response;
            const text = response.text();
            
            console.log('Sending response:', text);
            res.json({ response: text });
        } catch (apiError) {
            console.error('Gemini API Error:', apiError);
            throw new Error(`Gemini API Error: ${apiError.message}`);
        }
    } catch (error) {
        console.error('Detailed error:', error);
        res.status(500).json({ 
            error: "I apologize, but I'm having trouble processing your request right now. Please try again later.",
            details: error.message
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ 
        error: "Internal server error",
        details: err.message
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log('API Key:', process.env.GEMINI_API_KEY ? 'Present' : 'Missing');
}); 