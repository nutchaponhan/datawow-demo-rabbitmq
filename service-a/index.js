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

async function createRegisterUsers(conn){
    const ch = await conn.createChannel((err, channel) => {
        console.log('User Channel Error', err)
        channel.close();
        cb();
    });

    await ch.assertExchange('users', 'direct', {
        durable: true,
    })

    await ch.assertQueue('users-register', {
        durable: true,
        autoDelete: false,
    });

    await ch.bindQueue('users-register', 'users', 'register');
    
    setInterval(() => {
        console.log(`waiting register... ${(new Date()).getTime()}`);
    }, 1000)

    ch.consume('users-register', (msg) => {
        console.log('Register Message:');

        try {
            if (msg !== null) {
                const payload = JSON.parse(msg.content)
                console.log({ payload })
    
                if (!payload.success) {
                    console.log('Register: Fail');
                    throw Error('cannot regis user')   
                }
            }

            console.log('Register: Success');
            ch.ack(msg);
        } catch (error) {
            console.log('Consumer cannot process by server');
            ch.sendToQueue('users-recovery', msg.content);
            ch.nack(msg, false, false)
        }
        
    });
}

(async () => {
  const conn = await createConn();

  await createRegisterUsers(conn)

})();

// {"name": "bom", "success": false}