import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { initDatabase, saveMessage, getRecentMessages } from './db';


const app = express();
const httpServer = createServer(app);
app.use(cors());

const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
    }
});


const onlineUsers = new Map<string, string>();

io.on('connection', (socket) => {


    console.log('a user connected', socket.id);


    socket.on('join', async (username: string) => {
        onlineUsers.set(socket.id, username);
        console.log(`✅ ${username} joined (${socket.id})`);

        try {
            const messages = await getRecentMessages(20);
            socket.emit('chat_history', messages);
          } catch (error) {
            console.error('Error fetching messages:', error);
          }
      
          io.emit('user_joined', {
            username,
            onlineUsers: Array.from(onlineUsers.values())
          });
    });


    socket.on('send_message', async (data: { username: string; message: string }) => {
        try {
          // Save to database
          console.log('received message', data);

          console.log('Saving message to database', data.username, data.message);
          console.log('Type of data:', typeof data);
          let parsedData = undefined
          if (typeof data === 'string') {
            try {
                // 2. If it's a string, convert it to a JavaScript object
                parsedData = JSON.parse(data);
            } catch (error) {
                console.error('Error parsing JSON message:', error);
                // Handle error, maybe respond to client that message was invalid
                return; 
            }
        } else {
            // Assume it's already an object (or undefined, which will be handled below)
            parsedData = data;
        }
        console.log('parsed message', parsedData);

          const savedMessage = await saveMessage(parsedData.username, parsedData.message);
          
          // Broadcast to all connected clients
          io.emit('new_message', savedMessage);
          
        } catch (error) {
          console.error('Error saving message:', error);
        }
      });


    socket.on('disconnect', () => {
        const username  = onlineUsers.get(socket.id);
        onlineUsers.delete(socket.id);

        if (username) {
            console.log(`👋 ${username} left`);
            io.emit('user_left', {
                username,
                onlineUsers: Array.from(onlineUsers.values())
              })        }
        console.log('a user disconnected');
    });



});

app.get('health', (req, res) => {
    res.send('chat server is running');
});


const PORT = process.env.PORT || 5000;

initDatabase().then(() => {
    console.log('Database initialized successfully');

    httpServer.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}!!!!!!!!!!!!`);
    });

}).catch((error) => {
    console.error('Error initializing database:', error);
});

