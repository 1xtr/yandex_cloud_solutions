const { CreateQueueCommand, GetQueueAttributesCommand } = require('@aws-sdk/client-sqs')
const sqsClient = require('./client')

module.exports.handler = async function (event) {
  // https://api.slack.com/interactivity/slash-commands#app_command_handling
  // данные от Slack приходят строкой, поэтому строка будет в base64
  // раскодируем строку
  const raw = Buffer.from(event.body, 'base64').toString('ascii')
  const queue = {}
  // получим строку от пользователя
  const regexp = /&text=(.+)&api/g
  // проверяем что пришла команда от /sqs
  if (raw.includes('&command=%2Fsqs')) {
    // with regular expressions получим имя очереди
    const [, name] = regexp.exec(raw)
    queue.name = name
  }
  // если имя пустое то выходим
  if (!queue.name) {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
      isBase64Encoded: false,
      body: 'Ошибка в имени очереди',
    }
  }
  /**
   * метод создает мертвую очередь с приставкой к имени _dead
   * возвращает URL очереди
   * @param {string} deadQueueName Dead queue name
   * @returns {Promise<string>}
   */
  async function createDeadQueue(deadQueueName) {
    const params = {
      QueueName: `${deadQueueName}_dead`,
    }
    try {
      const result = await sqsClient.send(new CreateQueueCommand(params))
      return result['QueueUrl']
    } catch (e) {
      console.log(e)
    }
  }

  /**
   * метод по URL очереди получает его ARN для создания основной очереди
   * @param {string} QueueUrl Url of queue
   * @returns {Promise<string>}
   */
  async function getQueueArn(QueueUrl) {
    try {
      const { Attributes } = await sqsClient.send(
        new GetQueueAttributesCommand({
          QueueUrl,
          AttributeNames: ['QueueArn'],
        })
      )
      return Attributes['QueueArn']
    } catch (e) {
      console.log('getQueueArn error: ', e)
    }
  }

  queue.deadQueueUrl = await createDeadQueue(queue.name)
  queue.deadQueueArn = await getQueueArn(queue.deadQueueUrl)

  const RedrivePolicy = {
    deadLetterTargetArn: queue.deadQueueArn,
    maxReceiveCount: 1,
  }

  const params = {
    QueueName: queue.name,
    Attributes: {
      RedrivePolicy: JSON.stringify(RedrivePolicy),
    },
  }

  const result = await sqsClient.send(new CreateQueueCommand(params))
  queue.url = result['QueueUrl']

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
    isBase64Encoded: false,
    body: queue.url,
  }
}
