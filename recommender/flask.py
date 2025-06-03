from flask import Flask, request, jsonify
import pandas as pd
import numpy as np
import nltk
from nltk.stem.porter import PorterStemmer
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Initialize Flask
app = Flask(__name__)

# Preload NLTK resources
nltk.download('punkt')

# Load and preprocess the dataset
stemmer = PorterStemmer()
df = pd.read_csv('Coursera.csv')
df['tags'] = df['Course Description'] + " " + df['Skills']
df = df[['Course Name', 'University', 'Difficulty Level', 'Course Rating', 'Course URL', 'tags']]

def tag_stemmer(text):
    return " ".join([stemmer.stem(word) for word in text.split()]).lower()

df['tags'] = df['tags'].apply(tag_stemmer)

# Fit vectorizer once
cv = CountVectorizer(max_features=4000, stop_words='english')
cv.fit(df['tags'])

# Function to get recommendations
def recommend_courses(search_query, difficulty_level):
    search_query = " ".join([stemmer.stem(word) for word in search_query.lower().split()])
    search_vector = cv.transform([search_query]).toarray()
    similarity_scores = cosine_similarity(search_vector, cv.transform(df['tags']).toarray())

    sorted_indices = np.argsort(similarity_scores[0])[::-1]
    recommendations = []
    for idx in sorted_indices:
        if df.iloc[idx]['Difficulty Level'].lower() == difficulty_level.lower():
            recommendations.append({
                'Course Name': df.iloc[idx]['Course Name'],
                'University': df.iloc[idx]['University'],
                'Rating': df.iloc[idx]['Course Rating'],
                'URL': df.iloc[idx]['Course URL']
            })
        if len(recommendations) >= 5:
            break
    return recommendations

# Route to handle recommendation requests
@app.route('/recommend', methods=['POST'])
def recommend():
    data = request.get_json()
    topic = data.get('topic')
    difficulty = data.get('difficulty')

    if not topic or not difficulty:
        return jsonify({'error': 'Missing topic or difficulty'}), 400

    try:
        recommendations = recommend_courses(topic, difficulty)
        return jsonify(recommendations)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Run the Flask app
if __name__ == '__main__':
    app.run(debug=True)
