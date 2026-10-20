export async function defaultCache(value,cacheKey='default'){
  const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('guitar-models',1);r.onupgradeneeded=()=>r.result.createObjectStore('models');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
  try{return await new Promise((resolve,reject)=>{const tx=db.transaction('models',value?'readwrite':'readonly');const req=value?tx.objectStore('models').put(value,cacheKey):tx.objectStore('models').get(cacheKey);tx.oncomplete=()=>resolve(value || req.result);tx.onerror=()=>reject(tx.error);});}finally{db.close();}
}
