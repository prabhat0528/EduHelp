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
course_df=pd.read_csv('Coursera.csv')
# print(course_df.head())
course_df['tags']=course_df['Course Description'] + course_df['Skills']
course_df=course_df[['Course Name','University','Difficulty Level', 'Course Rating','Course URL','tags']]

def tag_stemmer(obj):
    l=[]
    for i in obj.split():
        l.append(stemmer.stem(i))
    return " ".join(l)

course_df['tags']=course_df['tags'].apply(tag_stemmer).apply(lambda x:x.lower())

cv=CountVectorizer(max_features=4000,stop_words='english')
vector=cv.fit_transform(course_df['tags']).toarray()

similarity_metrix=cosine_similarity(vector)
sorted(list(enumerate(similarity_metrix[0])), reverse=True,key=lambda x:x[1])[1:6]


def recommend_courses(search_query, difficulty_level, course_df, vectorizer):
    search_query = " ".join([stemmer.stem(word) for word in search_query.lower().split()])
    
    search_vector = vectorizer.transform([search_query]).toarray()
    
    similarity_scores = cosine_similarity(search_vector, vectorizer.transform(course_df['tags']).toarray())
    print(similarity_scores)
    
    
    sorted_indices = np.argsort(similarity_scores[0])[::-1]
    
   
    
    
    recommendations = []
    for idx in sorted_indices:
        if course_df.iloc[idx]['Difficulty Level'].lower() == difficulty_level.lower():
            recommendations.append({
                'Course Name': course_df.iloc[idx]['Course Name'],
                'University': course_df.iloc[idx]['University'],
                'Rating': course_df.iloc[idx]['Course Rating'],
                'URL': course_df.iloc[idx]['Course URL']
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
        recommendations = recommend_courses(topic, difficulty,course_df,cv)
        return jsonify(recommendations)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Run the Flask app
if __name__ == '__main__':
    app.run(debug=True)
