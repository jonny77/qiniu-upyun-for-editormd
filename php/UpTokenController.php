<?php
/**
 * Created by PhpStorm.
 * User: liufa
 * Date: 2018/12/26
 * Time: 10:13
 */

namespace App\Http\Controllers;


class UpTokenController extends Controller
{


    private $timeout = 3000;
    private $allowDir = ['article', 'avatar', 'news', 'common'];//图片文件夹分类存储

    private $uploadConfig = [
        'qiniu' => [
            //图片访问地址
            'uploadServer' => 'http://up.qiniu.com/',
            'viewBaseUrl' => 'http://pkfdqlk0e.bkt.clouddn.com/',
            'bucket' => 'your bucket name',
            //七牛的accessKey和secretKey,详见: https://portal.qiniu.com/user/key
            'accessKey' => 'your accessKey',
            'secretKey' => 'your secretKey',
        ],
        'upyun' => [
            'uploadServer' => 'http://v0.api.upyun.com/',
            'viewBaseUrl' => 'http://fagework.test.upcdn.net/',
            'bucket' => 'your bucket name',
            //又拍云,使用的是"操作员",而不是密钥的方式,详见:https://console.upyun.com/account/operators/
            'username' => 'user',
            'password' => 'password'
        ]
    ];

    private $savePath = '';//文件保存路径
    private $date = '';

    public function __construct()
    {
        $dir = request('dirName');
        if (!$dir || !in_array($dir, $this->allowDir)) {
            return response()->json(['status' => false, 'message' => '上传路径有误,请指定']);
        }
        $this->savePath = $dir . '/' . date('Ym/d', time()) . md5(time() . rand(100, 1000000));
        $this->date = gmdate('D, d M Y H:i:s \G\M\T');
    }


    //获取又拍云的授权
    public function getTokenUpyun()
    {
        $config = $this->uploadConfig['upyun'];
        $bucket = $config['bucket'];
        $uri = "/" . $bucket;
        $options = ["bucket" => $config['bucket'], "save-key" => $this->savePath, "expiration" => time() + ($this->timeout), "date" => $this->date];
        $policy = base64_encode(json_encode($options));
        $signature = base64_encode(hash_hmac("sha1", "POST&$uri&$this->date&$policy", md5($config['password']), true));
        $json['date'] = $this->date;
        $json['policy'] = $policy;
        $json['authorization'] = "UPYUN " . $config['username'] . ":" . $signature;
        $json['uploadServer'] = $config['uploadServer'] . $bucket;
        $json['viewBaseUrl'] = $config['viewBaseUrl'];
        $json['status'] = true;
        return $json;
    }

    //获取七牛云上传授权
    public function getTokenQiniu()
    {
        $config = $this->uploadConfig['qiniu'];
        $returnBody = [
            'saveKey' => '$(key)',
            'name' => '$(fname)',
            'size' => '$(fsize)',
            'w' => '$(imageInfo.width)',
            'h' => '$(imageInfo.height)',
            'hash' => '$(etag)'
        ];
        $policyData = array(
            "scope" => $config['bucket'],
            "deadline" => time() + 3600,
            "returnBody" => json_encode($returnBody),
            'saveKey' => $this->savePath
        );

        $data = json_encode($policyData);
        $encodedPutPolicy = $this->safe_base64_encode($data);
        $sign = hash_hmac('sha1', $encodedPutPolicy, $config['secretKey'], true);
        $result = $config['accessKey'] . ':' . $this->safe_base64_encode($sign) . ':' . $encodedPutPolicy;
        $json['authorization'] = $result;
        $json['uploadServer'] = $config['uploadServer'];
        $json['viewBaseUrl'] = $config['viewBaseUrl'];
        $json['status'] = true;
        return $json;
    }

    /**
     * base64转码(七牛需要按此处理)
     * @param $data
     * @return mixed
     */
    private function safe_base64_encode($data)
    {
        $find = array('+', '/');
        $replace = array('-', '_');
        return str_replace($find, $replace, base64_encode($data));
    }


}