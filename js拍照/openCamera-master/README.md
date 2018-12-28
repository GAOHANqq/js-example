## �ܹ�ʹ����������ֻ�������ͷ


�ܹ�ǰ������ͷ�л����ܹ���ȡ��ǰ��Ƶ��ͼ��

���ݸ��������������

��Ҫʹ�õ�api��
``` javascript

// ��ȡ��Ƶ��
navigator.mediaDevices.getUserMedia(constrains).then(success).catch(error);

// ��ȡ�豸������Ϣ
navigator.mediaDevices.enumerateDevices().then(gotDevices).then(getStream).catch(handleError);

```

֮ǰ�ڱ����ϲ���Chrome�������⣬��������û��ʹ��https��Ϊ�������ӣ����ʹ��http�Ļ�������Ŀ���ܴ�����ͷ���������chrome�����ļ����й�ϵ

���ʹ��http������ᱨ
` NotSupportedError Only secure origins are allowed (see: https://goo.gl/Y0ZkNV) `
���������ʼ��û�б�����ʼ��ֱ�����л�ȡ��Ƶ�����룬��Ŀ�Ĵ���·�ֹͣ����һ�㣬��Ӧλ�õ�console.logҲû��������������Ҳû�б�
�����������ԣ���ȡ��Ƶ���Ĵ�����ڵ���¼��У�����ų�������

#####�л�����ͷ���룺

```javascript
// ��ѡ������¼�
videoSelect.onchange = getStream;

// ��ȡ�豸��Ƶ����豸�������豸��������ֻ�õ��������豸
function gotDevices(deviceInfos) {
    console.log('deviceInfos')
	console.log('deviceInfos:', deviceInfos);
	for (let i = 0; i !== deviceInfos.length; i++) {
		let deviceInfo = deviceInfos[i];
		var option = document.createElement('option');
		// console.log(deviceInfo)
		if (deviceInfo.kind === 'videoinput') {  // audiooutput  , videoinput
			option.value = deviceInfo.deviceId;
	    	option.text = deviceInfo.label || 'camera ' + (videoSelect.length + 1);
	      	videoSelect.appendChild(option);
	    }
	}
}
```

���������:

```javascript

//�����û�ý���豸�ļ��ݷ���
function getUserMedia(constrains,success,error){
    if(navigator.mediaDevices.getUserMedia){
        //���±�׼API
        navigator.mediaDevices.getUserMedia(constrains).then(success).catch(error);
    } else if (navigator.webkitGetUserMedia){
        //webkit�ں������
        navigator.webkitGetUserMedia(constrains).then(success).catch(error);
    } else if (navigator.mozGetUserMedia){
        //Firefox�����
        navagator.mozGetUserMedia(constrains).then(success).catch(error);
    } else if (navigator.getUserMedia){
        //�ɰ�API
        navigator.getUserMedia(constrains).then(success).catch(error);
    }
}

```


��ȡ��Ƶ���ɹ��ص���
```javascript

function getStream(){

	if (window.stream) {
		window.stream.getTracks().forEach(function(track) {
			track.stop();
		})
	}

	if (navigator.mediaDevices.getUserMedia || navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia){
	    //�����û�ý���豸����������ͷ
	    const constraints = {
	        audio: true, 
	        video: {
	            width: { ideal: 1280 },
	            height: { ideal: 720 },
	            frameRate: { 
	                ideal: 10,
	                max: 15
	            },
	            deviceId: {exact: videoSelect.value}
	        }
	    };
	    console.log('��ȡ��Ƶ��');
	    getUserMedia(constraints,success,error);
	} else {
	    alert("����������֧�ַ����û�ý���豸");
	}
}

```

��ȡ��Ƶ����ΪͼƬ��

```javascript

//ע�����հ�ť�ĵ����¼�
document.getElementById("capture").addEventListener("click",function(){
    //���ƻ���
    console.log('����¼�');
    context.drawImage(video,0,0,480,320);
});

```






