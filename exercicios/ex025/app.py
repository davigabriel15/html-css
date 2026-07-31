from flask import Flask, request

app = Flask(__name__)

@app.route("/")
def formulario():
    return """
    <form action="/cadastro" method="get">
        Nome: <input type="text" name="nome"><br><br>
        Sobrenome: <input type="text" name="sobrenome"><br><br>
        <input type="submit" value="Enviar">
    </form>
    """

@app.route("/cadastro")
def cadastro():
    nome = request.args.get("nome")
    sobrenome = request.args.get("sobrenome")

    return f"Olá, {nome} {sobrenome}!"

if __name__ == "__main__":
    app.run(debug=True)