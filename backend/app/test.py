import google.generativeai as genai
genai.configure(api_key="AIzaSyABAZ_4ORDhHWsuEh-lcsHD_zI82zsgeU0")

models = genai.list_models()
for m in models:
    print(m.name, m.supported_generation_methods)
