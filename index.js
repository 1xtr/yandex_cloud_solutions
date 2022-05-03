const {CreateQueueCommand, GetQueueAttributesCommand} = require('@aws-sdk/client-sqs')
const sqsClient = require('./client')

module.exports.handler = async function (event) {
  // https://api.slack.com/interactivity/slash-commands#app_command_handling
  // данные от слака приходят строкой, поэтому строка будет в base64
  // раскодируем строку
  const raw = Buffer.from(event.body, 'base64').toString('ascii')
  let name
  // получим строку от пользователя
  const regexp = /&text=(.+)&api/g
  // проверяем что пришла команда от /sqs
  if (raw.includes('&command=%2Fsqs')) {
    // регуляркой получим имя очереди
    name = regexp.exec(raw)[1]
  }
  // если имя пустое то выходим
  if (!name) {
    return {
      statusCode: 200,
      headers: {
            'Content-Type': 'text/plain'
      },
      isBase64Encoded: false,
      body: 'Ошибка в имени очереди',
    }
  }
  // метод создает мертвую очередь с приставкой к имени _dead
  // возвращает URL очереди
  async function createDeadQueue(name) {
      const params = {
        'QueueName': `${name}_dead`,
      }
      try {
        const result = await sqsClient.send(new CreateQueueCommand(params))
        return result['QueueUrl']
      } catch (e) {
        console.log(e)
      }
  }
  // метод по URL очереди получает его ARN для создания основной очереди
  async function getQueueArn(QueueUrl) {
      try {
        const {Attributes} = await sqsClient.send(new GetQueueAttributesCommand({
          QueueUrl,
          AttributeNames: ['QueueArn'],
        }))
        return  Attributes['QueueArn']
      } catch (e) {
        console.log('getQueueArn error: ', e)
      }
  }
  
  const deadQueueUrl = await createDeadQueue(name)
  const deadQueueArn = await getQueueArn(deadQueueUrl)

  const RedrivePolicy = {
      deadLetterTargetArn: deadQueueArn,
      maxReceiveCount: 1
  }

  const params = {
      QueueName: name,
      Attributes: {
        RedrivePolicy: JSON.stringify(RedrivePolicy),
      },
  }

  const result = await sqsClient.send(new CreateQueueCommand(params))
  const queueUrl = result['QueueUrl']
    
  return {
      statusCode: 200,
      headers: {
            'Content-Type': 'text/plain'
      },
      isBase64Encoded: false,
      body: queueUrl,
  }
}
//03052022 01-56 finish