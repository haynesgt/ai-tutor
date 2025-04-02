const express = require('express');
const axios = require('axios');

const app = express();
const port = 3000;

// Middleware to parse JSON request bodies
app.use(express.json());

// Endpoint to handle chat requests
app.post('/chat', async (req, res) => {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Invalid input. "messages" must be an array.' });
    }

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-4',
                messages: messages,
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const reply = response.data.choices[0].message;
        res.json(reply);
    } catch (error) {
        console.error('Error communicating with OpenAI API:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to process the request.' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

/*
Example curl to test:
curl -X POST http://localhost:3000/chat \
-H "Content-Type: application/json" \
-d '{
    "messages": [
        {"role": "user", "content": "Hello!"},
        {"role": "assistant", "content": "Hi there! How can I assist you today?"},
        {"role": "user", "content": "What is 5 + 9?"}
    ]
}'
*/
