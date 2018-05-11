const restify = require('restify')
const Web3 = require('web3')
const corsMiddleware = require('restify-cors-middleware')
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.PROVIDER))

function serializeLogs (data) {
  const result = {
    status: '1',
    message: 'OK',
    result: [...data]
  }
  return result
}

function serializeTransactionReceipt (data) {
  const txnReceipt = {
    jsonrpc: '2.0',
    id: 1,
    result: { ...data }
  }
  return txnReceipt
}

async function getWeb3Method (options) {
  let payload
  let data
  switch (options.action) {
    case 'eth_getTransactionReceipt':
      try {
        data = await web3.eth.getTransactionReceipt(options.txhash)
        payload = serializeTransactionReceipt(data)
      } catch (e) {
        throw e
      }
      break
    case 'getLogs':
      const { fromBlock, toBlock, address } = options
      try {
        data = await web3.eth.getPastLogs({
          fromBlock: web3.utils.toHex(fromBlock),
          toBlock: web3.utils.toHex(toBlock),
          address
        })
        payload = serializeLogs(data)
      } catch (e) {
        throw e
      }
      break
    default:
      payload = {}
  }
  return payload
}

async function handleGetAPI (req, res, next) {
  let payload
  try {
    payload = await getWeb3Method(req.query)
  } catch (e) {
    return res.json({ status: 'error', message: e.message })
  }

  res.json(payload)
}

const server = restify.createServer()

const cors = corsMiddleware({
  origins: ['*'],
  allowHeaders: ['Access-Control-Allow-Origin'],
  exposeHeaders: ['Access-Control-Allow-Origin']
})

server.use(restify.plugins.queryParser())
server.pre(cors.preflight)
server.use(cors.actual)

server.get('/api', handleGetAPI)
server.head('/api', handleGetAPI)

server.listen(process.env.PORT || 7000, () => {
  console.log('%s listening at %s', server.name, server.url)
})
