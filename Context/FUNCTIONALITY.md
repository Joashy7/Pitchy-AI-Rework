Program functions in a 3 tier architecture. Interface -> engine -> storage.

Interface is all frontend, showing UI that the user can interact with and provide the engine with input. Interface is only connected to engine, collecting raw input from the user and parsing that input in the engine layer. The interface layer has no AI calls and no storage access. It delegates all logic to the engine and all persistence to storage.

Engine is the backend of the code, we currently want to seperate this to 2 files, server.js and engine.js. server.js will act as an initializer to the Node server that we need to run to start our web server. server.js should not be connected to interface or storage. engine.js will be connected to interface to accept user inputs and connect to storage to save these inputs into the google sheets. The engine structure will handle validating all logic and have no direct UI rendering.

Storage is the database of the code, we are using Google Sheets API connected via service_account.json and making calls in engine.js to save any neccessary data. It's main functionality is reading and writing data, while enforcing uniqueness or integrity.