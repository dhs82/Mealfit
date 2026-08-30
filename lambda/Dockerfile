FROM public.ecr.aws/lambda/python:3.9

# 1) 모델 아티팩트와 핸들러 복사
COPY handler.py random_forest_model.pkl scaler.pkl word2idx.pkl embedding_layer.pt /var/task/

# 2) 의존성 설치 (scikit-learn 추가)
RUN pip install --no-cache-dir \
    torch \
    pandas \
    numpy \
    joblib \
    scikit-learn \
  -t /var/task/

# 3) Lambda 핸들러 지정
CMD ["handler.lambda_handler"]
