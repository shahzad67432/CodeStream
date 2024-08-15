const redis = require('redis');
const {VM} = require('vm2');

const client = redis.createClient();
const publisher = redis.createClient();
client.on('error', (err) => console.log('Redis Client Error', err));
publisher.on('error', (err) => console.log('Redis publisher Error', err));


async function startWorker(){
    await client.connect();
    await publisher.connect();
    while(true){
    try{
        const problem = await client.brPop('problems', 0);
        if(problem){

            const parsedProblem = await JSON.parse(problem.element ?? '')
            console.log('Processing problem:', parsedProblem);

            const sandbox =  {
                capturedLogs: [],
                console: {
                    log: function (...args) {
                        sandbox.capturedLogs.push(args.join(' '));
                    }
                }
            }

            const vm = new VM({
                timeout: 1000, // Set a timeout to prevent infinite loops
                sandbox: sandbox
            });
            try{
                const result = vm.run(parsedProblem.code);
                const logs = vm.sandbox.capturedLogs.join('\n');
                const finalResult = `Result: ${result !== undefined ? result : 'no output'}\nLogs:\n${logs || "no output"}`;
                publisher.publish("results", finalResult)
                console.log('Execution Result:', result, logs || "no Output");
            }catch(executionError){
                const errorMessage = `Error executing code: ${executionError.message}`;
                await publisher.publish("results", errorMessage);
            }
        }
    }catch(e)
    {
        console.log('Error in worker/redis', e);
    }}
}

startWorker();