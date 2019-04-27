import {useReducer,useState} from "react";
import _ from 'lodash'


export const createStore = (reducer, init, ...applyProxy)=>{
  let id
  let state
  let subscribers = {}
  const dispatchers = []
  const ids = []
  const appendQueue = ({dispatch, id})=>{
    if(ids.includes(id)) return
    ids.push(id)
    dispatchers.push(dispatch)
    return true
  }

  const addSubScriber = (newSubscriber)=>{
    const key = _.keys(newSubscriber)[0]
    const listener = newSubscriber[_.keys(newSubscriber)[0]]
    const id = _.uniqueId()
    subscribers[key] 
      ? subscribers[key].push({listener, id})
      : subscribers[key] = [{listener, id}]
    return ()=>{
      _.remove(subscribers[key], {id})
    }
  } 

  let broadCast = action =>{
    const {type} = action
    if(type instanceof Function || type instanceof Promise){
      const {argument} = action
      return type(argument)
    }
    subscribers[type] && subscribers[type].length !== 0 
      ? setImmediate(()=>{
          _.forEach(subscribers[type], ({listener})=>listener(action[0]))
        }) 
      : _.noop()
    _.forEach(dispatchers, dispatch=>dispatch(action))
  }
  const flushState = s=>state=s
  const getState = () => state

  // code stole from redux >_<
  function compose(...funcs) {
    if (funcs.length === 0) {
      return arg => arg
    }
    if (funcs.length === 1) {
      return funcs[0]
    }
    return funcs.reduce((a, b) => (...args) => a(b(...args)))
  }
  if(applyProxy.length === 0){

  }else{
    const middlewareAPI = {
      getState: getState,
      dispatch: (...args) => broadCast(...args)
    }
    const chain = applyProxy.map(middleware => middleware(middlewareAPI))
    broadCast = compose(...chain)(broadCast)
  }
  // ... END ... 

  return {
    appendQueue,
    flushState,
    dispatch: broadCast,
    reducer, 
    addSubScriber,
    init,
    state
  } 
}


const useStore = ({appendQueue, dispatch: broadCast, reducer, init, flushState, addSubScriber}, stateFilter)=>{
  const [id, setID] = useState(_.uniqueId())
  const [state, dispatch] = useReducer(reducer, init)
  appendQueue({dispatch, id})
  flushState(state)
  const filteredState = stateFilter ? _.pick(state, stateFilter):state
  return [filteredState, broadCast, addSubScriber] 
}

export default useStore