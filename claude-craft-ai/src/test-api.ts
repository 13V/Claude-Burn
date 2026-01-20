import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

async function testAPI() {
    console.log('Testing Anthropic API...');
    console.log('API Key:', process.env.ANTHROPIC_API_KEY?.substring(0, 20) + '...');

    try {
        const response = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 100,
            messages: [
                { role: 'user', content: 'Say hello in 5 words or less.' }
            ]
        });

        console.log('✅ API Test Successful!');
        console.log('Response:', response.content[0]);
    } catch (error: any) {
        console.error('❌ API Test Failed!');
        console.error('Error type:', error.constructor?.name);
        console.error('Error message:', error.message);
        console.error('Error status:', error.status);
        if (error.error) {
            console.error('Error details:', JSON.stringify(error.error, null, 2));
        }
        if (error.body) {
            console.error('Error body:', error.body);
        }
    }
}

testAPI();
