const amqplib = require('amqplib');

async function createConn(){
    const conn = await amqplib.connect({
        protocol: 'amqp',
        hostname: 'localhost',
        port: 5672,
        username: 'admin',
        password: 'password'
      });

    return conn
}

async function createRecoveryUsers(conn){
    const ch = await conn.createChannel((err, channel) => {
        console.log('User Channel Error', err)
        channel.close();
        cb();
    });

    await ch.assertExchange('users', 'direct', {
        durable: true,
    })

    await ch.assertQueue('users-recovery', {
        durable: true,
        autoDelete: false,
    });

    await ch.bindQueue('users-recovery', 'users', 'recovery');

    setInterval(() => {
        console.log(`waiting recovery... ${(new Date()).getTime()}`);
    }, 1000)

    ch.consume('users-recovery', (msg) => {
        console.log('Recovery Message:');
        try {
            if (msg !== null) {
                const payload = JSON.parse(msg.content)
                console.log({ payload })
            }

            console.log('Recovery: Log');
            ch.ack(msg);
        } catch (error) {
            console.log('Consumer cannot process by server', { msg });
            ch.nack(msg, false, false)
        }
        
    });
}

(async () => {
    const conn = await createConn();

    await createRecoveryUsers(conn)
})();