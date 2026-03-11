FROM node:20-bullseye-slim

# Install Python and pip
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files and install Node dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Install Python dependencies
RUN pip3 install pandas numpy scikit-learn matplotlib seaborn loguru --break-system-packages

# Build the Vite frontend
RUN npm run build

# Set environment to production
ENV NODE_ENV=production

# Expose the port the app runs on
EXPOSE 3000

# Start the server
CMD ["npm", "start"]